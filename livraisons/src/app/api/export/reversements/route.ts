import { getCurrentUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { csvResponse, toCsv } from "@/lib/csv";
import { listSettlements } from "@/lib/finance";
import { isoToLocalInput, todayLocal } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/regions";

/** Historique des remises des livreurs et des reversements aux commerçants. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Accès refusé", { status: 403 });
  const country = countryOf(user);
  const rows = listSettlements(user, { limit: 20000 });
  const csv = toCsv(
    ["Date", "Type", "Livreur", "Commerçant", `Montant (${country.currencyLabel})`, "Livraisons", "Moyen", "Référence", "Note", "Enregistré par"],
    rows.map((s) => [
      isoToLocalInput(s.created_at, country.timezone).replace("T", " "),
      s.kind === "courier_remittance" ? "Remise du livreur" : "Reversement commerçant",
      s.courier_name, s.merchant_name, s.amount, s.delivery_count, paymentMethodLabel(country, s.method), s.reference, s.note, s.created_by_name,
    ]),
  );
  return csvResponse(`reversements-${todayLocal(country.timezone)}.csv`, csv);
}
