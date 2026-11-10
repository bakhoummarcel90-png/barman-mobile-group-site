import type { DeliveryStatus, PaymentStatus, Role } from "./constants";

/** Utilisateur connecté, avec son entreprise. */
export interface Actor {
  id: number;
  companyId: number;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  merchantId: number | null;
  companyName: string;
  countryCode: string;
}

export interface Company {
  id: number;
  name: string;
  country_code: string;
  currency: string;
  timezone: string;
  phone: string | null;
  signup_open: number;
  created_at: string;
}

export interface Merchant {
  id: number;
  company_id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  neighborhood: string | null;
  payout_method: string | null;
  payout_account: string | null;
  notes: string | null;
  active: number;
  review_pending: number;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: number;
  company_id: number;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  active: number;
  merchant_id: number | null;
  vehicle: string | null;
  zone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  pending: number;
}

export interface Delivery {
  id: number;
  company_id: number;
  reference: string;
  merchant_id: number;
  courier_id: number | null;
  customer_name: string;
  customer_phone: string;
  address: string;
  neighborhood: string;
  access_notes: string | null;
  amount_to_collect: number;
  expected_payment_method: string;
  delivery_fee: number;
  notes: string | null;
  scheduled_at: string | null;
  status: DeliveryStatus;
  failure_reason: string | null;
  courier_note: string | null;
  proof_photo: string | null;
  started_at: string | null;
  completed_at: string | null;
  collected_amount: number | null;
  collected_payment_method: string | null;
  payment_status: PaymentStatus;
  payment_note: string | null;
  payment_confirmed_by: number | null;
  payment_confirmed_at: string | null;
  courier_settlement_id: number | null;
  merchant_settlement_id: number | null;
  /** Colis international dont cette livraison est le « dernier kilomètre ». */
  shipment_id: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** Livraison avec les noms joints (commerçant, livreur, confirmateur). */
export interface DeliveryView extends Delivery {
  merchant_name: string;
  merchant_phone: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  confirmed_by_name: string | null;
}

export interface EventView {
  id: number;
  kind: string;
  from_status: DeliveryStatus | null;
  to_status: DeliveryStatus | null;
  message: string | null;
  created_at: string;
  user_name: string | null;
  user_role: Role | null;
  delivery_id: number | null;
  delivery_reference: string | null;
}
