import type { Metadata } from "next";
import { DeliveryForm } from "@/components/DeliveryForm";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { courierOptions, merchantOptions } from "@/lib/people";
import { getShipment } from "@/lib/shipments";

export const metadata: Metadata = { title: "Nouvelle commande" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  const merchants = merchantOptions(user);
  // Livraison au destinataire d'un colis international arrivé (?colis=ID).
  const colisId = Number((await searchParams).colis);
  const shipment = user.role === "admin" && Number.isInteger(colisId) && colisId > 0 ? getShipment(user, colisId) : null;
  const defaults: Record<string, string> = shipment
    ? {
        merchant_id: shipment.merchant_id ? String(shipment.merchant_id) : "new",
        new_merchant_name: shipment.merchant_id ? "" : "Particuliers – colis internationaux",
        customer_name: shipment.recipient_name,
        customer_phone: shipment.recipient_phone,
        address: shipment.recipient_address ?? "",
        neighborhood: "",
        amount_to_collect: shipment.fee_paid ? "0" : String(shipment.shipping_fee),
        expected_payment_method: "cash",
        delivery_fee: "0",
        notes: `Colis international ${shipment.tracking_number} : ${shipment.description} (${shipment.pieces} colis)`,
      }
    : { expected_payment_method: "cash", delivery_fee: "", amount_to_collect: "" };
  return (
    <>
      <PageHeader
        title={shipment ? `Livraison du colis ${shipment.tracking_number}` : "Nouvelle commande"}
        back={shipment ? { href: `/colis/${shipment.id}`, label: shipment.tracking_number } : { href: "/commandes", label: "Commandes" }}
      />
      {shipment ? (
        <div className="mb-4">
          <Alert tone="info">
            Informations reprises du colis. Vérifiez le quartier et le commerçant (pour un particulier, « Particuliers – colis
            internationaux » est proposé et sera créé automatiquement). Le montant à collecter correspond aux frais d'envoi non payés.
          </Alert>
        </div>
      ) : null}
      {user.role === "admin" && !merchants.some((m) => m.active) ? (
        <div className="mb-4">
          <Alert tone="warning">Ajoutez d'abord un commerçant actif dans la page Commerçants.</Alert>
        </div>
      ) : null}
      <DeliveryForm
        merchants={merchants}
        couriers={courierOptions(user)}
        paymentMethods={country.paymentMethods}
        neighborhoods={country.neighborhoods}
        currencyLabel={country.currencyLabel}
        phoneExample={country.phoneExample}
        city={country.city}
        isAdmin={user.role === "admin"}
        defaults={defaults}
        shipmentId={shipment?.id}
      />
    </>
  );
}
