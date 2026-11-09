import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.DATA_DIR = mkdtempSync(path.join(process.env.TEST_TMP || tmpdir(), "senlivraison-test-"));

const { closeDb, run } = await import("../src/lib/db");
const { hashPassword } = await import("../src/lib/password");
const D = await import("../src/lib/deliveries");
const F = await import("../src/lib/finance");
const P = await import("../src/lib/people");
const { parseFilters } = await import("../src/lib/filters");
const { normalizePhone, parseAmount, formatMoney, localInputToIso } = await import("../src/lib/format");
const { toCsv } = await import("../src/lib/csv");
type Actor = import("../src/lib/types").Actor;

function actor(id: number, companyId: number, role: Actor["role"], merchantId: number | null = null): Actor {
  return { id, companyId, role, merchantId, name: `u${id}`, email: null, phone: null, companyName: "X", countryCode: "SN" };
}

let admin: Actor, adminB: Actor, merchant: Actor, merchant2: Actor, courier: Actor, courier2: Actor;
let merchantId: number, merchant2Id: number;

before(() => {
  const a = run("INSERT INTO companies (name) VALUES ('A')").id;
  const b = run("INSERT INTO companies (name) VALUES ('B')").id;
  const h = hashPassword("motdepasse");
  const u = (c: number, role: string, merchant: number | null = null) =>
    run("INSERT INTO users (company_id, role, name, password_hash, merchant_id) VALUES (?, ?, ?, ?, ?)", c, role, role, h, merchant).id;
  merchantId = run("INSERT INTO merchants (company_id, name) VALUES (?, 'Boutique 1')", a).id;
  merchant2Id = run("INSERT INTO merchants (company_id, name) VALUES (?, 'Boutique 2')", a).id;
  admin = actor(u(a, "admin"), a, "admin");
  adminB = actor(u(b, "admin"), b, "admin");
  merchant = actor(u(a, "merchant", merchantId), a, "merchant", merchantId);
  merchant2 = actor(u(a, "merchant", merchant2Id), a, "merchant", merchant2Id);
  courier = actor(u(a, "courier"), a, "courier");
  courier2 = actor(u(a, "courier"), a, "courier");
});

after(() => closeDb());

function input(over: Partial<import("../src/lib/deliveries").DeliveryInput> = {}) {
  return {
    reference: null,
    merchantId,
    courierId: null,
    customerName: "Client",
    customerPhone: "+221700000099",
    address: "Villa 1",
    neighborhood: "Mermoz",
    accessNotes: null,
    amountToCollect: 10000,
    expectedPaymentMethod: "cash",
    deliveryFee: 2000,
    notes: null,
    scheduledAt: null,
    ...over,
  };
}

const all = parseFilters({}, "Africa/Dakar");

describe("formats", () => {
  test("téléphones sénégalais", () => {
    assert.equal(normalizePhone("77 123 45 67"), "+221771234567");
    assert.equal(normalizePhone("+221 77-123-45-67"), "+221771234567");
    assert.equal(normalizePhone("00221771234567"), "+221771234567");
    assert.equal(normalizePhone("7712345"), null);
  });
  test("montants FCFA", () => {
    assert.equal(parseAmount("15 000"), 15000);
    assert.equal(parseAmount("15.000"), 15000);
    assert.equal(parseAmount("-5"), null);
    assert.equal(parseAmount("12,5"), null);
    assert.match(formatMoney(15000), /^15\s000\sFCFA$/u);
  });
  test("fuseau Dakar (UTC+0)", () => {
    assert.equal(localInputToIso("2026-11-09T14:30", "Africa/Dakar"), "2026-11-09T14:30:00.000Z");
  });
  test("CSV : séparateur ; et protection des formules", () => {
    const csv = toCsv(["a", "b"], [["=SOMME(A1)", "x;y"]]);
    assert.ok(csv.includes("'=SOMME(A1)"));
    assert.ok(csv.includes('"x;y"'));
  });
});

describe("isolation des données", () => {
  test("chaque rôle ne voit que son périmètre", () => {
    const id1 = D.createDelivery(merchant, input());
    const id2 = D.createDelivery(merchant2, input({ merchantId: merchant2Id }));
    D.assignCourier(admin, id1, courier.id);

    assert.ok(D.getDelivery(admin, id1) && D.getDelivery(admin, id2));
    assert.equal(D.getDelivery(adminB, id1), null, "une autre entreprise ne voit rien");
    assert.ok(D.getDelivery(merchant, id1));
    assert.equal(D.getDelivery(merchant, id2), null, "un commerçant ne voit pas les commandes d'un autre");
    assert.ok(D.getDelivery(courier, id1));
    assert.equal(D.getDelivery(courier2, id1), null, "un livreur ne voit que ses livraisons");
    assert.equal(D.listDeliveries(adminB, all).total, 0);
    assert.equal(D.listDeliveries(merchant2, all).rows.every((d) => d.merchant_id === merchant2Id), true);
  });

  test("un commerçant ne peut pas créer pour une autre boutique", () => {
    const id = D.createDelivery(merchant, input({ merchantId: merchant2Id }));
    assert.equal(D.getDelivery(admin, id)!.merchant_id, merchantId);
  });

  test("un administrateur ne peut pas attribuer un livreur d'une autre entreprise", () => {
    const id = D.createDelivery(admin, input());
    assert.throws(() => D.assignCourier(adminB, id, courier.id), /introuvable/);
  });
});

describe("cycle de vie d'une livraison", () => {
  test("parcours complet et historique", () => {
    const id = D.createDelivery(admin, input({ courierId: courier.id }));
    assert.equal(D.getDelivery(admin, id)!.status, "attribuee");
    assert.throws(() => D.changeStatus(courier2, id, { to: "en_cours" }), /introuvable/);
    assert.throws(() => D.changeStatus(merchant, id, { to: "en_cours" }), /non autorisé/);
    D.changeStatus(courier, id, { to: "en_cours" });
    assert.throws(() => D.changeStatus(courier, id, { to: "livree" }), /montant/);
    D.changeStatus(courier, id, { to: "livree", collectedAmount: 10000, collectedMethod: "wave", note: "RAS" });
    const d = D.getDelivery(admin, id)!;
    assert.equal(d.status, "livree");
    assert.equal(d.payment_status, "a_verifier");
    assert.equal(d.collected_payment_method, "wave");
    assert.throws(() => D.changeStatus(admin, id, { to: "annulee" }), /non autorisé/);
  });

  test("écart automatique si le montant collecté diffère", () => {
    const id = D.createDelivery(admin, input({ courierId: courier.id }));
    D.changeStatus(courier, id, { to: "en_cours" });
    D.changeStatus(courier, id, { to: "livree", collectedAmount: 8000, collectedMethod: "cash" });
    const d = D.getDelivery(admin, id)!;
    assert.equal(d.payment_status, "ecart");
    assert.match(d.payment_note!, /Écart/);
  });

  test("échec : raison obligatoire, puis retour au commerçant", () => {
    const id = D.createDelivery(admin, input({ courierId: courier.id }));
    D.changeStatus(courier, id, { to: "en_cours" });
    assert.throws(() => D.changeStatus(courier, id, { to: "echec" }), /raison/);
    D.changeStatus(courier, id, { to: "echec", failureReason: "Client absent" });
    assert.equal(D.getDelivery(admin, id)!.payment_status, "non_encaisse");
    D.changeStatus(courier, id, { to: "retour_commercant" });
    assert.equal(D.getDelivery(admin, id)!.status, "retour_commercant");
  });

  test("le commerçant ne modifie plus une course démarrée", () => {
    const id = D.createDelivery(merchant, input());
    D.assignCourier(admin, id, courier.id);
    D.updateDelivery(merchant, id, input({ customerName: "Nouveau nom" }));
    D.changeStatus(courier, id, { to: "en_cours" });
    assert.throws(() => D.updateDelivery(merchant, id, input()), /démarré/);
    assert.throws(() => D.changeStatus(merchant, id, { to: "annulee" }), /non autorisé/);
  });

  test("numéro de commande unique par entreprise", () => {
    D.createDelivery(admin, input({ reference: "CMD-1" }));
    assert.throws(() => D.createDelivery(admin, input({ reference: "CMD-1" })), /existe déjà/);
    assert.doesNotThrow(() => D.createDelivery(adminB, { ...input({ reference: "CMD-1" }), merchantId: run("INSERT INTO merchants (company_id, name) VALUES (?, 'M')", adminB.companyId).id }));
  });
});

describe("encaissements et reversements", () => {
  test("confirmation, remise du livreur et reversement au commerçant", () => {
    const id = D.createDelivery(admin, input({ merchantId: merchant2Id, courierId: courier2.id, amountToCollect: 20000, deliveryFee: 2500 }));
    D.changeStatus(courier2, id, { to: "en_cours" });
    D.changeStatus(courier2, id, { to: "livree", collectedAmount: 20000, collectedMethod: "cash" });

    assert.throws(() => D.reviewPayment(merchant2, id, { status: "confirme", collectedAmount: 20000, method: "cash", note: null }));
    assert.throws(() => D.reviewPayment(admin, id, { status: "ecart", collectedAmount: 20000, method: "cash", note: null }), /Décrivez/);

    const before = F.merchantBalances(admin, merchant2Id)[0];
    assert.equal(before.pending_net, 17500);
    D.reviewPayment(admin, id, { status: "confirme", collectedAmount: 20000, method: "cash", note: null });
    const d = D.getDelivery(admin, id)!;
    assert.equal(d.payment_status, "confirme");
    assert.equal(d.payment_confirmed_by, admin.id);
    assert.ok(d.payment_confirmed_at);

    assert.equal(F.courierBalances(admin, courier2.id)[0].total, 20000);
    assert.equal(F.merchantBalances(admin, merchant2Id)[0].net, 17500);
    assert.equal(F.merchantBalances(merchant2)[0].merchant_id, merchant2Id, "le commerçant voit son solde");

    F.recordCourierRemittance(admin, courier2.id, { method: "cash", reference: null, note: null });
    assert.equal(F.courierBalances(admin, courier2.id).length, 0);
    const payout = F.recordMerchantPayout(admin, merchant2Id, { method: "wave", reference: "TX1", note: null });
    assert.equal(payout.amount, 17500);
    assert.equal(F.merchantBalances(admin, merchant2Id).length, 0);
    assert.throws(() => D.reviewPayment(admin, id, { status: "confirme", collectedAmount: 1, method: "cash", note: null }), /reversement/);
    assert.equal(F.listSettlements(merchant2).length, 1);
    assert.equal(F.listSettlements(merchant).length, 0);
  });
});

describe("comptes", () => {
  test("désactivation d'un livreur avec des courses en cours refusée", () => {
    const c = P.createCourier(admin, { name: "Test", phone: "+221700000555", email: null, vehicle: "Moto", zone: null, notes: null, password: "motdepasse" });
    const id = D.createDelivery(admin, input({ courierId: c }));
    assert.throws(() => P.setUserActive(admin, c, false), /réattribuez/);
    D.assignCourier(admin, id, null);
    P.setUserActive(admin, c, false);
    assert.throws(() => D.assignCourier(admin, id, c), /désactivé/);
  });
  test("identifiants uniques", () => {
    assert.throws(
      () => P.createCourier(admin, { name: "Doublon", phone: "+221700000555", email: null, vehicle: null, zone: null, notes: null, password: "motdepasse" }),
      /déjà utilisé/,
    );
  });
  test("un commerçant désactivé ne peut plus recevoir de commandes", () => {
    P.setMerchantActive(admin, merchant2Id, false);
    assert.throws(() => D.createDelivery(admin, input({ merchantId: merchant2Id })), /désactivé/);
    P.setMerchantActive(admin, merchant2Id, true);
  });
});
