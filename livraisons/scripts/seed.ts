/**
 * Données de démonstration : un petit service de livraison à Dakar.
 *
 *   npm run seed            → crée les données si la base est vide
 *   npm run seed -- --reset → vide la base puis recrée les données
 *
 * Mot de passe des comptes : variable DEMO_PASSWORD, sinon un mot de passe
 * aléatoire est généré et affiché dans le terminal. Aucun mot de passe réel
 * n'est écrit dans le code. Les numéros de téléphone sont fictifs (70 000 …).
 */
import { closeDb, getDb, get, run } from "../src/lib/db";
import { localInputToIso, todayLocal, addDays } from "../src/lib/format";
import { generatePassword, hashPassword } from "../src/lib/password";
import type { DeliveryStatus, PaymentStatus } from "../src/lib/constants";

const TZ = "Africa/Dakar";
const reset = process.argv.includes("--reset");
const db = getDb();

const existing = get<{ n: number }>("SELECT COUNT(*) AS n FROM companies")!.n;
if (existing && !reset) {
  console.log("La base contient déjà des données. Utilisez `npm run seed -- --reset` pour tout effacer et recréer la démonstration.");
  closeDb();
  process.exit(0);
}
if (reset) {
  for (const t of ["events", "deliveries", "settlements", "sessions", "users", "merchants", "companies"]) db.exec(`DELETE FROM ${t}`);
  console.log("Base vidée.");
}

const password = process.env.DEMO_PASSWORD || generatePassword();
if (password.length < 8) {
  console.error("DEMO_PASSWORD doit contenir au moins 8 caractères.");
  process.exit(1);
}
const hash = hashPassword(password);

db.exec("BEGIN");

const company = run(
  "INSERT INTO companies (name, country_code, currency, timezone, phone) VALUES (?, 'SN', 'XOF', ?, ?)",
  "Dakar Express Livraison",
  TZ,
  "+221700000000",
).id;

function user(role: string, name: string, email: string | null, phone: string | null, extra: { merchant?: number; vehicle?: string; zone?: string; active?: number } = {}) {
  return run(
    `INSERT INTO users (company_id, role, name, email, phone, password_hash, merchant_id, vehicle, zone, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    company,
    role,
    name,
    email,
    phone,
    hash,
    extra.merchant ?? null,
    extra.vehicle ?? null,
    extra.zone ?? null,
    extra.active ?? 1,
  ).id;
}

const admin = user("admin", "Awa Ndiaye", "admin@demo.sn", "+221700000001");

const couriers = {
  moussa: user("courier", "Moussa Diop", "moussa@demo.sn", "+221700000011", { vehicle: "Moto", zone: "Plateau, Médina, Fann" }),
  ibrahima: user("courier", "Ibrahima Fall", null, "+221700000012", { vehicle: "Moto", zone: "Almadies, Ngor, Ouakam, Yoff" }),
  cheikh: user("courier", "Cheikh Sarr", null, "+221700000013", { vehicle: "Vélo", zone: "Mermoz, Sacré-Cœur, Point E" }),
  modou: user("courier", "Modou Gueye", null, "+221700000014", { vehicle: "Moto", zone: "Pikine, Guédiawaye", active: 0 }),
};

function merchant(name: string, contact: string, email: string, phone: string, address: string, quartier: string, payout: string, account: string | null) {
  const id = run(
    `INSERT INTO merchants (company_id, name, contact_name, phone, email, address, neighborhood, payout_method, payout_account)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    company,
    name,
    contact,
    phone,
    email,
    address,
    quartier,
    payout,
    account,
  ).id;
  user("merchant", contact, email, phone, { merchant: id });
  return id;
}

const merchants = {
  wax: merchant("Keur Sokhna Wax", "Sokhna Mbaye", "boutique@demo.sn", "+221700000021", "Marché HLM, cantine 112", "HLM", "wave", "+221700000021"),
  cosmetiques: merchant("Teranga Cosmétiques", "Fatou Sy", "teranga@demo.sn", "+221700000022", "Rue 10 x Bourguiba", "Sicap Baobab", "orange_money", "+221700000022"),
  saloum: merchant("Saveurs du Saloum", "Abdou Ba", "saloum@demo.sn", "+221700000023", "Villa 45, Cité Keur Gorgui", "Cité Keur Gorgui", "cash", null),
  tech: merchant("Dakar Tech Store", "Ousmane Faye", "tech@demo.sn", "+221700000024", "Avenue Lamine Guèye", "Plateau", "wave", "+221700000024"),
};

const customers: [string, string, string, string][] = [
  ["Mame Diarra Thiam", "Cité Mixta, immeuble B, 3e étage", "Liberté 6", "Derrière la boulangerie Mixta, interphone 32"],
  ["Aliou Cissé", "Villa 218, Sacré-Cœur 3", "Sacré-Cœur 3", "Portail vert, à côté de la mosquée"],
  ["Ndèye Fatou Kane", "Résidence Les Almadies, appt 5", "Almadies", "Demander le gardien, Mamadou"],
  ["Babacar Ndour", "Rue 7, Médina", "Médina", "En face de la pharmacie Guigon"],
  ["Rokhaya Diallo", "Cité Djily Mbaye, villa 12", "Yoff", "Près du rond-point Yoff, maison jaune"],
  ["Serigne Mbacké Sow", "Immeuble Fahd, bureau 404", "Plateau", "Remettre à l'accueil avant 17 h"],
  ["Coumba Ngom", "Unité 15, villa 342", "Parcelles Assainies", "Appeler en arrivant à la station Total"],
  ["Khadija Seck", "Rue de Ouakam, villa 9", "Ouakam", "Après le terrain de foot, porte bleue"],
  ["Lamine Badji", "Cité Fadia, villa 77", "Grand Yoff", ""],
  ["Astou Faye", "Point E, rue de Kaolack, villa 3", "Point E", "Sonner deux fois"],
  ["Pape Malick Diop", "Ngor village, près du débarcadère", "Ngor", "Appeler, ruelle étroite"],
  ["Fatima Camara", "Mermoz pyrotechnie, villa 21", "Mermoz", ""],
  ["Daouda Sané", "Hann Maristes, villa 104", "Hann Maristes", "Derrière l'école"],
  ["Aminata Touré", "Keur Massar, cité Aliou Sow", "Keur Massar", "Livraison après 18 h seulement"],
  ["Ousseynou Diagne", "Fass Delorme, rue 12", "Fass", ""],
  ["Seynabou Gaye", "Ouest Foire, cité Africa", "Ouest Foire", "Immeuble C, 2e porte à gauche"],
];

const methods = ["cash", "cash", "wave", "orange_money", "cash", "wave"];
const items = [12500, 8000, 25000, 15000, 4500, 35000, 18000, 9500, 60000, 22000, 7500, 0];

const today = todayLocal(TZ);
let refCounter = 0;

function at(dayOffset: number, hhmm: string): string {
  return localInputToIso(`${addDays(today, dayOffset)}T${hhmm}`, TZ)!;
}
function plusMinutes(iso: string, m: number): string {
  return new Date(new Date(iso).getTime() + m * 60000).toISOString();
}
function event(deliveryId: number, userId: number, kind: string, when: string, from: string | null, to: string | null, message: string | null) {
  run(
    "INSERT INTO events (company_id, user_id, delivery_id, kind, from_status, to_status, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    company,
    userId,
    deliveryId,
    kind,
    from,
    to,
    message,
    when,
  );
}

interface Spec {
  day: number;
  time: string;
  /** Pour les courses à venir : prévue dans N minutes (évite qu'elles soient « en retard » selon l'heure du lancement). */
  inMinutes?: number;
  merchant: number;
  courier?: number;
  status: DeliveryStatus;
  collected?: number;
  payment?: PaymentStatus;
  failure?: string;
  note?: string;
}

const courierNames: Record<number, string> = {
  [couriers.moussa]: "Moussa Diop",
  [couriers.ibrahima]: "Ibrahima Fall",
  [couriers.cheikh]: "Cheikh Sarr",
  [couriers.modou]: "Modou Gueye",
};

function delivery(s: Spec): number {
  refCounter++;
  const [name, address, quartier, access] = customers[refCounter % customers.length];
  const amount = items[refCounter % items.length];
  const method = amount === 0 ? "wave" : methods[refCounter % methods.length];
  const fee = quartier === "Keur Massar" || quartier === "Ngor" || quartier === "Almadies" ? 2500 : quartier === "Plateau" || quartier === "Médina" ? 1500 : 2000;
  const scheduled = s.inMinutes !== undefined ? plusMinutes(new Date().toISOString(), s.inMinutes) : at(s.day, s.time);
  const created = plusMinutes(scheduled, -180);
  const merchantUser = get<{ id: number }>("SELECT id FROM users WHERE merchant_id = ?", s.merchant)!.id;
  const creator = refCounter % 3 === 0 ? admin : merchantUser;
  const started = ["en_cours", "livree", "echec", "retour_commercant"].includes(s.status) ? plusMinutes(scheduled, -25) : null;
  const completed = ["livree", "echec", "retour_commercant"].includes(s.status) ? plusMinutes(scheduled, 10) : null;
  const collected = s.status === "livree" ? (s.collected ?? amount) : s.status === "echec" || s.status === "retour_commercant" ? 0 : null;
  let payment: PaymentStatus = s.payment ?? "non_encaisse";
  if (s.status === "livree" && !s.payment) payment = collected === amount ? "a_verifier" : "ecart";
  const confirmed = payment === "confirme" || (payment === "ecart" && s.payment === "ecart");
  const phone = `+22170000${String(1000 + refCounter).slice(-4)}`;
  const reference = `LIV-${addDays(today, s.day).replace(/-/g, "").slice(2)}-${String(refCounter).padStart(3, "0")}`;

  const id = run(
    `INSERT INTO deliveries (company_id, reference, merchant_id, courier_id, customer_name, customer_phone, address, neighborhood,
       access_notes, amount_to_collect, expected_payment_method, delivery_fee, notes, scheduled_at, status, failure_reason, courier_note,
       started_at, completed_at, collected_amount, collected_payment_method, payment_status, payment_note, payment_confirmed_by,
       payment_confirmed_at, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    company,
    reference,
    s.merchant,
    s.courier ?? null,
    name,
    phone,
    address,
    quartier,
    access || null,
    amount,
    method,
    fee,
    amount === 0 ? "Déjà payé en ligne" : null,
    scheduled,
    s.status,
    s.failure ?? null,
    s.note ?? null,
    started,
    completed,
    collected,
    collected ? method : null,
    payment,
    payment === "ecart" ? `Écart : ${collected} FCFA encaissés pour ${amount} FCFA attendus.` : null,
    confirmed ? admin : null,
    confirmed ? plusMinutes(completed ?? scheduled, 120) : null,
    creator,
    created,
    completed ?? started ?? created,
  ).id;

  event(id, creator, "created", created, null, "a_attribuer", "Commande créée");
  if (s.courier && s.status !== "annulee") {
    event(id, admin, "status", plusMinutes(created, 20), "a_attribuer", "attribuee", `Attribuée à ${courierNames[s.courier]}`);
  }
  if (started) event(id, s.courier!, "status", started, "attribuee", "en_cours", null);
  if (s.status === "livree")
    event(id, s.courier!, "status", completed!, "en_cours", "livree", collected ? `Encaissé ${collected} FCFA` : "Rien encaissé");
  if (s.status === "echec" || s.status === "retour_commercant")
    event(id, s.courier!, "status", completed!, "en_cours", "echec", s.failure ?? null);
  if (s.status === "retour_commercant")
    event(id, s.courier!, "status", plusMinutes(completed!, 90), "echec", "retour_commercant", "Colis rapporté à la boutique");
  if (s.status === "annulee") event(id, creator, "status", plusMinutes(created, 30), "a_attribuer", "annulee", "Client a annulé par téléphone");
  if (payment === "confirme") event(id, admin, "payment", plusMinutes(completed!, 120), null, null, "Encaissement — Confirmé");
  return id;
}

const { moussa, ibrahima, cheikh, modou } = couriers;
const { wax, cosmetiques, saloum, tech } = merchants;

// Il y a quelques jours : tout est livré, confirmé, en partie reversé.
const old: number[] = [];
for (const [day, time, m, c] of [
  [-6, "10:00", wax, moussa], [-6, "11:30", cosmetiques, ibrahima], [-5, "15:00", saloum, cheikh],
  [-5, "16:30", tech, moussa], [-4, "09:30", wax, ibrahima], [-4, "12:00", cosmetiques, modou],
  [-3, "14:00", tech, cheikh], [-3, "17:00", saloum, moussa],
] as const) old.push(delivery({ day, time, merchant: m, courier: c, status: "livree", payment: "confirme" }));
delivery({ day: -4, time: "18:00", merchant: saloum, courier: modou, status: "retour_commercant", failure: "Client injoignable" });
delivery({ day: -3, time: "10:00", merchant: wax, status: "annulee" });

// Hier : livrées, une à vérifier, un écart, un échec à traiter.
delivery({ day: -1, time: "10:30", merchant: wax, courier: moussa, status: "livree", payment: "confirme" });
delivery({ day: -1, time: "11:00", merchant: tech, courier: ibrahima, status: "livree", payment: "confirme" });
delivery({ day: -1, time: "14:30", merchant: cosmetiques, courier: cheikh, status: "livree" });
delivery({ day: -1, time: "16:00", merchant: saloum, courier: moussa, status: "livree", collected: 10000 });
delivery({ day: -1, time: "18:30", merchant: wax, courier: ibrahima, status: "echec", failure: "Client absent", note: "Personne au portail, voisin dit rappeler demain" });

// Aujourd'hui : à attribuer, attribuées, en cours, livrées.
delivery({ day: 0, time: "08:30", merchant: wax, courier: moussa, status: "livree" });
delivery({ day: 0, time: "09:00", merchant: tech, courier: ibrahima, status: "livree" });
delivery({ day: 0, time: "10:00", merchant: cosmetiques, courier: moussa, status: "en_cours" });
delivery({ day: 0, time: "10:30", merchant: saloum, courier: cheikh, status: "en_cours" });
delivery({ day: 0, time: "11:30", merchant: wax, courier: moussa, status: "attribuee", inMinutes: 40 });
delivery({ day: 0, time: "12:00", merchant: tech, courier: ibrahima, status: "attribuee", inMinutes: 75 });
delivery({ day: 0, time: "15:00", merchant: cosmetiques, courier: cheikh, status: "attribuee", inMinutes: 120 });
delivery({ day: 0, time: "16:00", merchant: wax, status: "a_attribuer", inMinutes: 150 });
delivery({ day: 0, time: "17:30", merchant: saloum, status: "a_attribuer", inMinutes: 180 });
delivery({ day: 0, time: "18:00", merchant: tech, status: "a_attribuer", inMinutes: -30 }); // volontairement en retard
delivery({ day: 1, time: "10:00", merchant: cosmetiques, status: "a_attribuer" });

// Remises et reversements passés (sur les livraisons les plus anciennes).
function settle(kind: "courier_remittance" | "merchant_payout", who: number, ids: number[], method: string, when: string) {
  const col = kind === "courier_remittance" ? "courier_settlement_id" : "merchant_settlement_id";
  const rows = ids.map((id) => get<{ id: number; collected_amount: number; delivery_fee: number; courier_id: number; merchant_id: number }>("SELECT * FROM deliveries WHERE id = ?", id)!);
  const sel = rows.filter((r) => (kind === "courier_remittance" ? r.courier_id === who : r.merchant_id === who));
  if (!sel.length) return;
  const amount = sel.reduce((s, r) => s + (kind === "courier_remittance" ? r.collected_amount : r.collected_amount - r.delivery_fee), 0);
  const sid = run(
    `INSERT INTO settlements (company_id, kind, courier_id, merchant_id, amount, delivery_count, method, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    company,
    kind,
    kind === "courier_remittance" ? who : null,
    kind === "merchant_payout" ? who : null,
    amount,
    sel.length,
    method,
    admin,
    when,
  ).id;
  for (const r of sel) run(`UPDATE deliveries SET ${col} = ? WHERE id = ?`, sid, r.id);
}
for (const c of [moussa, ibrahima, cheikh, modou]) settle("courier_remittance", c, old, "cash", at(-2, "19:00"));
settle("merchant_payout", wax, old, "wave", at(-2, "19:30"));
settle("merchant_payout", tech, old, "wave", at(-2, "19:35"));

db.exec("COMMIT");
closeDb();

console.log(`
Données de démonstration créées : « Dakar Express Livraison ».

Mot de passe de tous les comptes : ${password}
${process.env.DEMO_PASSWORD ? "" : "(généré aléatoirement — définissez DEMO_PASSWORD pour choisir le vôtre)\n"}
  Administrateur : admin@demo.sn
  Commerçant     : boutique@demo.sn   (Keur Sokhna Wax)
  Livreur        : 70 000 00 11       (Moussa Diop — connexion par téléphone)

Les numéros de téléphone de la démonstration sont fictifs.
`);
