import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.DATA_DIR = mkdtempSync(path.join(process.env.TEST_TMP || tmpdir(), "senlivraison-gp-"));

const { closeDb, get, run } = await import("../src/lib/db");
const { hashPassword } = await import("../src/lib/password");
const { addDays, todayLocal } = await import("../src/lib/format");
const G = await import("../src/lib/gp");
const S = await import("../src/lib/signup");
const P = await import("../src/lib/people");
const D = await import("../src/lib/deliveries");
const GR = await import("../src/lib/growth");
const { deliveryScope } = await import("../src/lib/scope");
type Actor = import("../src/lib/types").Actor;

const today = todayLocal("Africa/Dakar");

function actor(id: number, companyId: number, role: Actor["role"], merchantId: number | null = null): Actor {
  return { id, companyId, role, merchantId, name: `u${id}`, email: null, phone: null, companyName: "X", countryCode: "SN" };
}

let admin: Actor, gp: Actor, gp2: Actor, sender: Actor, sender2: Actor, courier: Actor, adminB: Actor;

before(() => {
  const a = run("INSERT INTO companies (name, gp_fee, gp_payment_info) VALUES ('A', 1000, 'Wave : 70 000 00 00')").id;
  const b = run("INSERT INTO companies (name) VALUES ('B')").id;
  const h = hashPassword("motdepasse");
  const u = (c: number, role: string, phone: string, merchant: number | null = null) =>
    run("INSERT INTO users (company_id, role, name, phone, password_hash, merchant_id) VALUES (?, ?, ?, ?, ?, ?)", c, role, `${role} ${phone}`, phone, h, merchant).id;
  const m1 = run("INSERT INTO merchants (company_id, name) VALUES (?, 'Boutique 1')", a).id;
  const m2 = run("INSERT INTO merchants (company_id, name) VALUES (?, 'Boutique 2')", a).id;
  admin = actor(u(a, "admin", "+221700000901"), a, "admin");
  adminB = actor(u(b, "admin", "+221700000902"), b, "admin");
  gp = actor(u(a, "gp", "+221700000903"), a, "gp");
  gp2 = actor(u(a, "gp", "+221700000904"), a, "gp");
  sender = actor(u(a, "merchant", "+221700000905", m1), a, "merchant", m1);
  sender2 = actor(u(a, "merchant", "+221700000906", m2), a, "merchant", m2);
  courier = actor(u(a, "courier", "+221700000907"), a, "courier");
});

after(() => closeDb());

function tripForm(over: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const values = {
    origin_country: "SN",
    origin_city: "Dakar",
    destination_country: "FR",
    destination_city: "Paris",
    departure_date: addDays(today, 5),
    arrival_date: addDays(today, 6),
    capacity_kg: "10",
    price_per_kg: "7000",
    currency: "XOF",
    dropoff_place: "Liberté 6",
    ...over,
  };
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

function newTrip(owner = gp, over: Record<string, string> = {}): number {
  const parsed = G.parseTripForm(tripForm(over), today);
  assert.ok(parsed.data, JSON.stringify(parsed.errors));
  return G.createTrip(owner, parsed.data);
}

const booking = (kg: number) => ({ weightGrams: kg * 1000, description: "Vêtements", recipientName: "Awa", recipientPhone: "+33600000001", recipientCity: "Paris" });

describe("GP : voyages", () => {
  test("validation du formulaire", () => {
    const past = G.parseTripForm(tripForm({ departure_date: addDays(today, -1) }), today);
    assert.ok(past.errors.departure_date);
    const same = G.parseTripForm(tripForm({ destination_country: "SN", destination_city: "dakar" }), today);
    assert.ok(same.errors.destination_city);
    const heavy = G.parseTripForm(tripForm({ capacity_kg: "500" }), today);
    assert.ok(heavy.errors.capacity_kg);
    const arrival = G.parseTripForm(tripForm({ arrival_date: addDays(today, 2) }), today);
    assert.ok(arrival.errors.arrival_date);
    const ok = G.parseTripForm(tripForm({ capacity_kg: "23,5" }), today);
    assert.equal(ok.data?.capacityGrams, 23500);
  });

  test("seul un GP publie ; la liste publique montre les voyages ouverts", () => {
    const parsed = G.parseTripForm(tripForm(), today);
    assert.throws(() => G.createTrip(sender, parsed.data!), /réservée aux GP/);
    const id = newTrip();
    const open = G.openTrips(admin.companyId, { from: "SN", to: "FR" });
    assert.ok(open.some((t) => t.id === id));
    assert.equal(G.openTrips(admin.companyId, { to: "US" }).some((t) => t.id === id), false);
    assert.equal(G.openTrips(adminB.companyId).length, 0, "isolation entre entreprises");
  });

  test("un autre GP ne voit ni ne modifie le voyage", () => {
    const id = newTrip();
    assert.equal(G.getTrip(gp2, id), null);
    assert.throws(() => G.setTripStatus(gp2, id, "complet"), /introuvable/);
    assert.equal(G.getTrip(adminB, id), null);
    assert.ok(G.getTrip(sender, id), "visible par un expéditeur tant qu'il est ouvert");
  });
});

describe("GP : réservations et frais", () => {
  test("parcours complet : réservation, paiement, vérification, contacts, livraison, note", () => {
    const tripId = newTrip(gp, { capacity_kg: "10" });
    assert.throws(() => G.createBooking(gp, tripId, booking(1)), /commerçant ou particulier/);
    assert.throws(() => G.createBooking(sender, tripId, booking(11)), /Il reste seulement/);
    const id = G.createBooking(sender, tripId, booking(4));
    let b = G.getBooking(sender, id)!;
    assert.equal(b.status, "a_payer");
    assert.equal(b.fee, 1000);
    assert.equal(b.gp_phone, null, "téléphone du GP caché avant paiement");
    const seenByGp = G.getBooking(gp, id)!;
    assert.equal(seenByGp.sender_phone, null, "téléphone de l'expéditeur caché avant paiement");
    assert.equal(seenByGp.recipient_phone, "");
    assert.equal(G.getBooking(sender2, id), null, "autre expéditeur : aucun accès");
    assert.equal(G.getBooking(gp2, id), null, "autre GP : aucun accès");

    assert.throws(() => G.declarePayment(sender, id, "cash", "ABCD"), /moyen de paiement/);
    assert.throws(() => G.declarePayment(sender2, id, "wave", "ABCD"), /introuvable/);
    G.declarePayment(sender, id, "wave", "WV-123");
    assert.equal(G.getBooking(admin, id)!.status, "a_verifier");
    assert.ok(G.bookingsToVerify(admin).some((x) => x.id === id));
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Paiement GP à vérifier'", admin.id));

    assert.throws(() => G.confirmBooking(gp, id), /administrateur/);
    G.rejectPayment(admin, id, "Aucun transfert reçu");
    b = G.getBooking(sender, id)!;
    assert.equal(b.status, "a_payer");
    assert.equal(b.admin_note, "Aucun transfert reçu");
    G.declarePayment(sender, id, "orange_money", "OM-456");
    G.confirmBooking(admin, id);

    b = G.getBooking(sender, id)!;
    assert.equal(b.status, "confirmee");
    assert.equal(b.gp_phone, "+221700000903", "contact du GP dévoilé");
    assert.equal(G.getBooking(gp, id)!.sender_phone, "+221700000905", "contact de l'expéditeur dévoilé");
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Nouvelle réservation confirmée'", gp.id));
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Réservation confirmée'", sender.id));

    assert.throws(() => G.cancelBooking(sender, id), /contactez le GP/);
    assert.throws(() => G.rateBooking(sender, id, 5, null), /une fois le colis livré/);
    assert.throws(() => G.markBookingDelivered(gp, id), /reçu et vérifié/);
    assert.throws(() => G.receiveBooking(gp, id, false, null), /Cochez la case/);
    assert.throws(() => G.receiveBooking(gp2, id, true, null), /introuvable/);
    assert.throws(() => G.receiveBooking(sender, id, true, null), /introuvable/);
    G.receiveBooking(gp, id, true, null);
    assert.ok(G.getBooking(sender, id)!.checked_at);
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Colis reçu par le GP'", sender.id));
    G.markBookingDelivered(gp, id);
    assert.throws(() => G.rateBooking(sender, id, 6, null), /1 à 5/);
    G.rateBooking(sender, id, 4, "Bien");
    assert.throws(() => G.rateBooking(sender, id, 5, null), /déjà noté/);
    const trip = G.getTrip(admin, tripId)!;
    assert.equal(trip.rating_avg, 4);
    assert.equal(trip.rating_count, 1);
  });

  test("voyage plein : complet, puis rouvert si une réservation est annulée", () => {
    const tripId = newTrip(gp, { capacity_kg: "5" });
    const a = G.createBooking(sender, tripId, booking(3));
    const b2 = G.createBooking(sender2, tripId, booking(2));
    assert.equal(G.getTrip(admin, tripId)!.status, "complet");
    assert.equal(G.openTrips(admin.companyId).some((t) => t.id === tripId), false);
    assert.throws(() => G.createBooking(sender, tripId, booking(1)), /n'accepte plus/);
    G.cancelBooking(sender2, b2);
    assert.equal(G.getTrip(admin, tripId)!.status, "ouvert");
    assert.equal(G.remainingGrams(G.getTrip(admin, tripId)!), 2000);
    assert.equal(G.getBooking(sender, a)!.status, "a_payer");
  });

  test("annulation d'un voyage : le GP ne peut pas si des colis sont confirmés", () => {
    const tripId = newTrip(gp);
    const confirmed = G.createBooking(sender, tripId, booking(2));
    const waiting = G.createBooking(sender2, tripId, booking(2));
    G.confirmBooking(admin, confirmed);
    assert.throws(() => G.setTripStatus(gp, tripId, "annule"), /confirmée/);
    G.setTripStatus(admin, tripId, "annule");
    assert.equal(G.getBooking(admin, confirmed)!.status, "annulee");
    assert.equal(G.getBooking(admin, waiting)!.status, "annulee");
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Voyage GP annulé'", sender2.id));
  });

  test("frais à 0 : réservation confirmée tout de suite", () => {
    const fd = new FormData();
    fd.set("gp_fee", "0");
    assert.deepEqual(G.saveGpSettings(admin, fd).errors, {});
    const tripId = newTrip(gp);
    const id = G.createBooking(sender, tripId, booking(1));
    const b = G.getBooking(sender, id)!;
    assert.equal(b.status, "confirmee");
    assert.equal(b.fee, 0);
    const back = new FormData();
    back.set("gp_fee", "1000");
    assert.ok(G.saveGpSettings(admin, back).errors.gp_payment_info, "numéro de paiement exigé quand il y a des frais");
    back.set("gp_payment_info", "Wave : 70 000 00 00");
    assert.deepEqual(G.saveGpSettings(admin, back).errors, {});
  });

  test("téléphone du destinataire à l'étranger", () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ weight_kg: "2,5", description: "Habits", recipient_name: "Awa", recipient_phone: "+33 6 12 34 56 78", accept_rules: "1" })) fd.set(k, v);
    const parsed = G.parseBookingForm(fd, "SN");
    assert.equal(parsed.data?.recipientPhone, "+33612345678");
    assert.equal(parsed.data?.weightGrams, 2500);
    fd.delete("accept_rules");
    assert.ok(G.parseBookingForm(fd, "SN").errors.accept_rules);
  });
});

describe("GP : comptes et accès", () => {
  test("inscription d'un GP : en attente, puis acceptée par l'administrateur", () => {
    const id = S.registerGp(admin.companyId, { name: "Ousmane Kane", phone: "+221700000950", email: null, routes: "Dakar ↔ Madrid", password: "motdepasse1" });
    const u = get<{ role: string; active: number; pending: number }>("SELECT role, active, pending FROM users WHERE id = ?", id)!;
    assert.deepEqual({ ...u }, { role: "gp", active: 0, pending: 1 });
    assert.ok(S.pendingApplicants(admin, "gp").some((x) => x.id === id));
    assert.equal(S.pendingCouriers(admin).some((x) => x.id === id), false, "pas mélangé aux livreurs");
    assert.throws(() => S.approveCourier(admin, id, "courier"), /introuvable/);
    S.approveCourier(admin, id, "gp");
    assert.equal(get<{ active: number }>("SELECT active FROM users WHERE id = ?", id)!.active, 1);
  });

  test("un GP ne voit aucune livraison ni aucun colis", () => {
    const scope = deliveryScope(gp);
    assert.match(scope.sql, /\b0\b/);
    const d = D.createDelivery(admin, {
      reference: null, merchantId: sender.merchantId!, courierId: courier.id, customerName: "C", customerPhone: "+221700000999", address: "A", neighborhood: "Mermoz",
      accessNotes: null, amountToCollect: 0, expectedPaymentMethod: "cash", deliveryFee: 0, notes: null, scheduledAt: null, shipmentId: null, newMerchantName: null,
      vehicleType: "Moto", options: [], preferredCourierId: null, manualFee: 1500,
    });
    assert.equal(D.getDelivery(gp, d), null);
    assert.throws(() => D.createDelivery(gp, { reference: null, merchantId: sender.merchantId!, courierId: null, customerName: "C", customerPhone: "+221700000999", address: "A", neighborhood: "Mermoz", accessNotes: null, amountToCollect: 0, expectedPaymentMethod: "cash", deliveryFee: 0, notes: null, scheduledAt: null, shipmentId: null, newMerchantName: null, vehicleType: "Moto", options: [], preferredCourierId: null, manualFee: null }));
  });

  test("suppression du compte d'un GP", () => {
    const id = run("INSERT INTO users (company_id, role, name, phone, password_hash) VALUES (?, 'gp', 'GP test', '+221700000960', ?)", admin.companyId, hashPassword("motdepasse")).id;
    const me = actor(id, admin.companyId, "gp");
    const tripId = newTrip(me);
    const b = G.createBooking(sender, tripId, booking(1));
    G.confirmBooking(admin, b);
    assert.throws(() => P.deleteOwnAccount(me, "motdepasse"), /colis confirmé/);
    G.receiveBooking(me, b, true, null);
    G.markBookingDelivered(me, b);
    const open = newTrip(me);
    P.deleteOwnAccount(me, "motdepasse");
    assert.equal(G.getTrip(admin, open)!.status, "annule");
    assert.equal(get<{ name: string }>("SELECT name FROM users WHERE id = ?", id)!.name, "Compte supprimé");
  });
});

describe("lancement gratuit et suivi de la croissance", () => {
  test("frais à 0 par défaut pour une nouvelle entreprise", () => {
    const c = run("INSERT INTO companies (name) VALUES ('Nouvelle')").id;
    assert.equal(G.gpSettings(c).fee, 0);
  });
  test("lundi de la semaine", () => {
    assert.equal(GR.mondayOf("2026-11-14"), "2026-11-09"); // samedi
    assert.equal(GR.mondayOf("2026-11-09"), "2026-11-09"); // lundi
    assert.equal(GR.mondayOf("2026-11-15"), "2026-11-09"); // dimanche
  });
  test("statistiques réservées à l'administrateur, semaine en cours en premier", () => {
    assert.equal(GR.growthStats(sender), null);
    const s = GR.growthStats(admin)!;
    assert.equal(s.weeks.length, 8);
    assert.equal(s.weeks[0].start, GR.mondayOf(today));
    assert.ok(s.weeks[0].gpBookings > 0, "réservations de la semaine comptées");
    assert.ok(s.weeks[0].signups >= 6, "inscriptions de la semaine comptées (hors administrateurs)");
    assert.ok(s.totals.gps >= 2);
    assert.equal(GR.growthStats(adminB)!.totals.gpBookings, 0, "isolation entre entreprises");
  });
});

describe("garde-fous GP", () => {
  test("valeur déclarée facultative, montant vérifié", () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ weight_kg: "2", description: "Habits", recipient_name: "Awa", recipient_phone: "+33612345678", accept_rules: "1" })) fd.set(k, v);
    assert.equal(G.parseBookingForm(fd, "SN").data?.declaredValue, null);
    fd.set("declared_value", "50 000");
    assert.equal(G.parseBookingForm(fd, "SN").data?.declaredValue, 50000);
    fd.set("declared_value", "beaucoup");
    assert.ok(G.parseBookingForm(fd, "SN").errors.declared_value);
    const tripId = newTrip(gp);
    const id = G.createBooking(sender, tripId, { ...booking(1), declaredValue: 75000 });
    assert.equal(G.getBooking(admin, id)!.declared_value, 75000);
  });

  test("le GP refuse un colis non conforme : réservation annulée, voyage rouvert, administrateurs prévenus", () => {
    const tripId = newTrip(gp, { capacity_kg: "2" });
    const id = G.createBooking(sender, tripId, booking(2));
    G.confirmBooking(admin, id);
    assert.equal(G.getTrip(admin, tripId)!.status, "complet");
    assert.throws(() => G.refuseBooking(gp, id, "x"), /pourquoi/);
    assert.throws(() => G.refuseBooking(sender, id, "Contenu suspect"), /introuvable/);
    G.refuseBooking(gp, id, "Contenu différent de la déclaration");
    const b = G.getBooking(admin, id)!;
    assert.equal(b.status, "annulee");
    assert.equal(b.refusal_reason, "Contenu différent de la déclaration");
    assert.equal(G.getTrip(admin, tripId)!.status, "ouvert");
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Colis refusé par un GP'", admin.id));
    assert.throws(() => G.receiveBooking(gp, id, true, null), /confirmée/);
  });

  test("signalements : expéditeur et GP de la réservation seulement, un seul en cours, traités par l'administrateur", () => {
    const tripId = newTrip(gp);
    const id = G.createBooking(sender, tripId, booking(1));
    assert.throws(() => G.createReport(sender, id, "inconnu", null), /motif/);
    assert.throws(() => G.createReport(sender, id, "autre", null), /Décrivez/);
    assert.throws(() => G.createReport(sender2, id, "contenu", null), /introuvable/);
    assert.throws(() => G.createReport(gp2, id, "contenu", null), /introuvable/);
    const r = G.createReport(sender, id, "injoignable", "Le GP ne répond pas");
    assert.throws(() => G.createReport(sender, id, "injoignable", null), /déjà un signalement/);
    G.createReport(gp, id, "contenu", "L'expéditeur veut envoyer des médicaments");
    assert.ok(get("SELECT 1 FROM notifications WHERE user_id = ? AND title = 'Nouveau signalement GP'", admin.id));
    assert.equal(G.openReportCount(admin), 2);
    assert.equal(G.bookingReports(sender, id).length, 1, "chacun ne voit que ses signalements");
    assert.equal(G.bookingReports(admin, id).length, 2);
    assert.throws(() => G.resolveReport(gp, r, "ok"), /administrateur/);
    G.resolveReport(admin, r, "GP joint par téléphone");
    assert.equal(G.openReportCount(admin), 1);
    assert.throws(() => G.resolveReport(admin, r, "encore"), /déjà traité/);
    assert.equal(G.listReports(adminB).length, 0, "isolation entre entreprises");
  });
});

describe("sécurité", () => {
  test("installation bloquée en production sans SETUP_CODE", async () => {
    const { setupBlocked } = await import("../src/lib/setup");
    const env = process.env as Record<string, string | undefined>;
    const saved = { n: env.NODE_ENV, c: env.SETUP_CODE };
    try {
      env.NODE_ENV = "production"; delete env.SETUP_CODE;
      assert.equal(setupBlocked(), true);
      env.SETUP_CODE = "un-code-secret";
      assert.equal(setupBlocked(), false);
      env.NODE_ENV = "development"; delete env.SETUP_CODE;
      assert.equal(setupBlocked(), false);
    } finally {
      env.NODE_ENV = saved.n; if (saved.c === undefined) delete env.SETUP_CODE; else env.SETUP_CODE = saved.c;
    }
  });
  test("abonnements push : seulement les services des navigateurs", async () => {
    const { isPushEndpoint } = await import("../src/lib/notifications");
    assert.equal(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc123def456"), true);
    assert.equal(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
    assert.equal(isPushEndpoint("https://web.push.apple.com/QGx1234567"), true);
    assert.equal(isPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=abc"), true);
    assert.equal(isPushEndpoint("https://evil.example.com/collect?x=1"), false);
    assert.equal(isPushEndpoint("https://fcm.googleapis.com.evil.com/x123456789"), false);
    assert.equal(isPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false);
  });
  test("connexion : blocage après 20 échecs depuis la même adresse", async () => {
    const { ipLockedFor, recordIpFailure } = await import("../src/lib/ratelimit");
    const ip = "203.0.113.7";
    for (let i = 0; i < 19; i++) recordIpFailure(ip);
    assert.equal(ipLockedFor(ip), 0);
    recordIpFailure(ip);
    assert.ok(ipLockedFor(ip) > 0);
    assert.equal(ipLockedFor("203.0.113.8"), 0, "les autres adresses ne sont pas bloquées");
  });
});
