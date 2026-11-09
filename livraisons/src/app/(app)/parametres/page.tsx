import type { Metadata } from "next";
import { companyAction } from "@/app/actions";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { AdminForm, ResetPassword, ToggleUser } from "@/components/PeopleForms";
import { ActiveBadge, Card, DefinitionList, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf, getCompany } from "@/lib/company";
import { formatDateTime, formatPhone } from "@/lib/format";
import { listAdmins } from "@/lib/people";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const company = getCompany(user.companyId);
  const admins = listAdmins(user);

  return (
    <>
      <PageHeader title="Paramètres" description="Entreprise, administrateurs et intégrations" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Entreprise">
          <ActionForm action={companyAction}>
            <Field label="Nom de l'entreprise" name="name" required>
              <input id="name" name="name" className="input" defaultValue={company.name} />
            </Field>
            <Field label="Téléphone" name="phone">
              <input id="phone" name="phone" type="tel" className="input" defaultValue={company.phone ? formatPhone(company.phone, country) : ""} />
            </Field>
            <SubmitButton>Enregistrer</SubmitButton>
          </ActionForm>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <DefinitionList
              items={[
                ["Pays", country.name],
                ["Devise", `${country.currencyLabel} (${country.currency})`],
                ["Fuseau horaire", country.timezone],
                ["Moyens de paiement", country.paymentMethods.map((m) => m.label).join(", ")],
              ]}
            />
            <p className="mt-3 text-xs text-ink-muted">
              Pays, devise et moyens de paiement sont définis dans <code>src/lib/regions.ts</code> : un nouveau pays s'ajoute en une entrée.
            </p>
          </div>
        </Card>

        <Card title="Intégrations">
          <ul className="space-y-4 text-sm">
            {[
              [
                country.paymentMethods.filter((m) => m.kind !== "cash").map((m) => m.label).join(", ") || "Mobile money",
                "Non connectés. Les paiements sont saisis par le livreur puis confirmés à la main, d'après le relevé de chaque opérateur.",
              ],
              ["SMS", "Aucun service d'envoi configuré. Les boutons « SMS » ouvrent l'application Messages du téléphone avec un texte prérempli."],
              ["WhatsApp", "Aucune API configurée. Les boutons « WhatsApp » ouvrent WhatsApp (wa.me) avec un texte prérempli ; l'envoi reste manuel."],
              [
                "Transporteurs internationaux",
                "Non connectés (DHL, FedEx, UPS, compagnies aériennes et maritimes). Les étapes des colis sont saisies à la main ; un lien vers le site du transporteur est proposé pour DHL, FedEx et UPS.",
              ],
            ].map(([name, text]) => (
              <li key={name} className="flex items-start gap-3">
                <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                  Manuel
                </span>
                <span>
                  <strong className="text-ink">{name}</strong>
                  <br />
                  <span className="text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-ink-muted">
            Une intégration automatique demande un contrat marchand et des clés API fournies par chaque opérateur (opérateurs de mobile money,
            fournisseur SMS, WhatsApp Business, transporteurs). Aucune connexion n'est simulée dans cette version : voir le fichier README pour les paramètres à prévoir.
          </p>
        </Card>

        <Card title="Administrateurs" className="lg:col-span-2">
          <ul className="mb-5 divide-y divide-slate-100">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ink">
                    {a.name} {a.id === user.id ? <span className="text-xs font-normal text-ink-muted">(vous)</span> : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {a.email ?? formatPhone(a.phone, country)} · dernière connexion {a.last_login_at ? formatDateTime(a.last_login_at, country) : "jamais"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ActiveBadge active={a.active} />
                  {a.id !== user.id ? (
                    <>
                      <ResetPassword userId={a.id} name={a.name} />
                      <ToggleUser userId={a.id} active={!!a.active} name={a.name} />
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <AdminForm />
        </Card>
      </div>
    </>
  );
}
