import { getCurrentUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { csvResponse, toCsv } from "@/lib/csv";
import { courierBalances, merchantBalances } from "@/lib/finance";
import { todayLocal } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/regions";

/** Soldes actuels : montants à remettre par livreur et à reverser par commerçant. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Accès refusé", { status: 403 });
  const country = countryOf(user);
  const cur = country.currencyLabel;
  const rows: (string | number)[][] = [];
  for (const c of courierBalances(user)) {
    rows.push(["Livreur — à remettre", c.name, c.count, c.total, "", "", "", "", Object.entries(c.byMethod).map(([m, v]) => `${paymentMethodLabel(country, m)}: ${v}`).join(" | ")]);
  }
  for (const m of merchantBalances(user)) {
    rows.push([
      "Commerçant — à reverser", m.name, m.confirmed_count, m.collected, m.fees, m.net, m.pending_count, m.pending_net,
      `${paymentMethodLabel(country, m.payout_method)} ${m.payout_account ?? ""}`.trim(),
    ]);
  }
  const csv = toCsv(
    ["Type", "Nom", "Livraisons", `Encaissé (${cur})`, `Frais (${cur})`, `Net à reverser (${cur})`, "En vérification", `Net en vérification (${cur})`, "Détail / reversement"],
    rows,
  );
  return csvResponse(`soldes-${todayLocal(country.timezone)}.csv`, csv);
}
