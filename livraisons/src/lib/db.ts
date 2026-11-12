import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

/**
 * Base SQLite locale (module `node:sqlite` intégré à Node ≥ 22.13).
 * Un seul fichier : DATA_DIR/app.db (par défaut ./data/app.db).
 *
 * Toutes les tables métier portent `company_id` : chaque requête de l'app
 * filtre sur l'entreprise de l'utilisateur connecté (voir lib/scope.ts).
 */

export const SCHEMA_VERSION = 1;

const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'SN',
  currency TEXT NOT NULL DEFAULT 'XOF',
  timezone TEXT NOT NULL DEFAULT 'Africa/Dakar',
  phone TEXT,
  -- 1 = inscription publique ouverte (/inscription)
  signup_open INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS merchants (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  neighborhood TEXT,
  payout_method TEXT,
  payout_account TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  -- 1 = inscrit lui-même, pas encore vérifié par l'administrateur
  review_pending INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_merchants_company ON merchants(company_id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  role TEXT NOT NULL CHECK (role IN ('admin','merchant','courier')),
  name TEXT NOT NULL,
  email TEXT COLLATE NOCASE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  merchant_id INTEGER REFERENCES merchants(id),
  vehicle TEXT,
  zone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at TEXT,
  -- 1 = livreur inscrit lui-même, en attente de validation par l'administrateur
  pending INTEGER NOT NULL DEFAULT 0,
  -- 0 = inscrit lui-même, e-mail pas encore confirmé par le code reçu
  email_verified INTEGER NOT NULL DEFAULT 1,
  CHECK (role <> 'merchant' OR merchant_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,               -- empreinte SHA-256 du jeton (le jeton brut n'est jamais stocké)
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  kind TEXT NOT NULL CHECK (kind IN ('courier_remittance','merchant_payout')),
  courier_id INTEGER REFERENCES users(id),
  merchant_id INTEGER REFERENCES merchants(id),
  amount INTEGER NOT NULL,
  delivery_count INTEGER NOT NULL,
  method TEXT,
  reference TEXT,
  note TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_settlements_company ON settlements(company_id, created_at);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  reference TEXT NOT NULL,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  courier_id INTEGER REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  access_notes TEXT,
  amount_to_collect INTEGER NOT NULL DEFAULT 0,
  expected_payment_method TEXT NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'a_attribuer'
    CHECK (status IN ('a_attribuer','attribuee','en_cours','livree','echec','retour_commercant','annulee')),
  failure_reason TEXT,
  courier_note TEXT,
  proof_photo TEXT,
  started_at TEXT,
  completed_at TEXT,
  -- Encaissement (saisie manuelle)
  collected_amount INTEGER,
  collected_payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'non_encaisse'
    CHECK (payment_status IN ('non_encaisse','a_verifier','confirme','ecart')),
  payment_note TEXT,
  payment_confirmed_by INTEGER REFERENCES users(id),
  payment_confirmed_at TEXT,
  courier_settlement_id INTEGER REFERENCES settlements(id),
  merchant_settlement_id INTEGER REFERENCES settlements(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (company_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(company_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier ON deliveries(company_id, courier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_merchant ON deliveries(company_id, merchant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON deliveries(company_id, scheduled_at);

-- Colis internationaux (Europe, Chine, États-Unis… ↔ Afrique), suivis manuellement.
CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  tracking_number TEXT NOT NULL UNIQUE,
  merchant_id INTEGER REFERENCES merchants(id),
  client_reference TEXT,
  transport_mode TEXT NOT NULL,
  carrier TEXT,
  carrier_tracking TEXT,
  origin_country TEXT NOT NULL,
  origin_city TEXT,
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT,
  description TEXT NOT NULL,
  pieces INTEGER NOT NULL DEFAULT 1,
  weight_grams INTEGER,
  declared_value INTEGER,
  declared_currency TEXT,
  shipping_fee INTEGER NOT NULL DEFAULT 0,
  fee_paid INTEGER NOT NULL DEFAULT 0,
  estimated_arrival TEXT,
  status TEXT NOT NULL DEFAULT 'enregistre'
    CHECK (status IN ('enregistre','recu_origine','en_transit','arrive_destination','douane','pret','livre','incident','annule')),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_merchant ON shipments(company_id, merchant_id);

-- Étapes de suivi d'un colis (affichées, sans les notes internes, sur la page publique /suivi).
CREATE TABLE IF NOT EXISTS shipment_events (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  shipment_id INTEGER NOT NULL REFERENCES shipments(id),
  user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL,
  location TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_shipment_events ON shipment_events(shipment_id, id);

-- Notifications pour les administrateurs (une ligne par destinataire).
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

-- Abonnements aux notifications push (un par appareil / navigateur).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Codes de vérification envoyés par e-mail à l'inscription.
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sends INTEGER NOT NULL DEFAULT 1,
  last_sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Réglages techniques générés automatiquement (ex. clés VAPID des notifications push).
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Journal : changements de statut, encaissements, modifications, gestion des comptes.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  user_id INTEGER REFERENCES users(id),
  delivery_id INTEGER REFERENCES deliveries(id),
  subject_user_id INTEGER REFERENCES users(id),
  merchant_id INTEGER REFERENCES merchants(id),
  kind TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_events_company ON events(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_delivery ON events(delivery_id);
`;

export function dataDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), "data"));
}

/**
 * Charge `node:sqlite` en filtrant uniquement son avertissement « expérimental »
 * (le module est stable en pratique depuis Node 22.13 ; les autres
 * avertissements restent affichés).
 */
function loadSqlite(): typeof import("node:sqlite") {
  const original = process.emitWarning;
  process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
    const text = typeof warning === "string" ? warning : warning.message;
    if (text.includes("SQLite is an experimental feature")) return;
    return (original as (...a: unknown[]) => void).call(process, warning, ...rest);
  }) as typeof process.emitWarning;
  try {
    return process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
  } finally {
    process.emitWarning = original;
  }
}

function open(): DatabaseSync {
  const { DatabaseSync } = loadSqlite();
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "app.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Évolutions du schéma sur une base existante (ajouts de colonnes). */
function migrate(db: DatabaseSync): void {
  const columns = (table: string) =>
    new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name));
  if (!columns("companies").has("signup_open")) {
    db.exec("ALTER TABLE companies ADD COLUMN signup_open INTEGER NOT NULL DEFAULT 1");
  }
  if (!columns("merchants").has("review_pending")) {
    db.exec("ALTER TABLE merchants ADD COLUMN review_pending INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns("users").has("pending")) {
    db.exec("ALTER TABLE users ADD COLUMN pending INTEGER NOT NULL DEFAULT 0");
  }
  // Fonctions « à la demande » : véhicule, prix, bourse aux courses, suivi GPS, notes, signature.
  const add: [string, string, string][] = [
    ["companies", "dispatch_mode", "TEXT NOT NULL DEFAULT 'manuel'"],
    ["companies", "tariffs", "TEXT"],
    ["deliveries", "vehicle_type", "TEXT"],
    ["deliveries", "options", "TEXT"],
    ["deliveries", "distance_km", "REAL"],
    ["deliveries", "tracking_token", "TEXT"],
    ["deliveries", "preferred_courier_id", "INTEGER REFERENCES users(id)"],
    ["deliveries", "offered_until", "TEXT"],
    ["deliveries", "courier_lat", "REAL"],
    ["deliveries", "courier_lng", "REAL"],
    ["deliveries", "courier_pos_at", "TEXT"],
    ["deliveries", "rating", "INTEGER"],
    ["deliveries", "rating_comment", "TEXT"],
    ["deliveries", "rated_at", "TEXT"],
    ["deliveries", "signature", "TEXT"],
  ];
  for (const [table, column, ddl] of add) {
    if (!columns(table).has(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_token) WHERE tracking_token IS NOT NULL");
  if (!columns("users").has("email_verified")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1");
  }
  if (!columns("deliveries").has("shipment_id")) {
    db.exec("ALTER TABLE deliveries ADD COLUMN shipment_id INTEGER REFERENCES shipments(id)");
  }
}

const globalForDb = globalThis as unknown as { __senlivraisonDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__senlivraisonDb) globalForDb.__senlivraisonDb = open();
  return globalForDb.__senlivraisonDb;
}

/** Ferme la connexion (utilisé par les tests et le script de démonstration). */
export function closeDb(): void {
  globalForDb.__senlivraisonDb?.close();
  globalForDb.__senlivraisonDb = undefined;
}

export type SqlValue = string | number | bigint | null | Uint8Array;

// node:sqlite renvoie des objets sans prototype : on les copie en objets
// ordinaires pour pouvoir les transmettre aux composants React.
export function all<T>(sql: string, ...params: SqlValue[]): T[] {
  return getDb().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}

export function get<T>(sql: string, ...params: SqlValue[]): T | undefined {
  const row = getDb().prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: SqlValue[]): { changes: number; id: number } {
  const r = getDb().prepare(sql).run(...params);
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) };
}

/** Exécute `fn` dans une transaction : tout est enregistré, ou rien. */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
