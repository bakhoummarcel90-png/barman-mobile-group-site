import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { ContactButtons } from "@/components/ContactButtons";
import { BookingBadge, formatDay } from "@/components/GpTripCard";
import { BookingButtons, DeclarePaymentForm, PaymentDecision, RateGpForm } from "@/components/GpForms";
import { Alert, Card, DefinitionList, OkBanner, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import * as gp from "@/lib/gp";
import { paymentMethodLabel, shippingCountryName } from "@/lib/regions";

export const metadata: Metadata = { title: "Réservation GP" };
export const dynamic = "force-dynamic";

const OK = {
  reservee: "Réservation enregistrée.",
  paiement: "Merci ! Votre paiement est en cours de vérification. Vous recevrez le contact du GP dès qu'il sera confirmé.",
  annuler: "Réservation annulée.",
  livree: "Colis marqué comme remis au destinataire.",
  noter: "Merci pour votre avis !",
  "paiement-confirme": "Paiement confirmé : l'expéditeur et le GP ont reçu leurs coordonnées.",
  "paiement-refuse": "L'expéditeur est prévenu que son paiement n'a pas été retrouvé.",
};

const STEPS: { key: gp.BookingStatus[]; label: string }[] = [
  { key: ["a_payer", "a_verifier", "confirmee", "livree"], label: "Kilos réservés" },
  { key: ["a_verifier", "confirmee", "livree"], label: "Frais payés" },
  { key: ["confirmee", "livree"], label: "Confirmée : contacts échangés" },
  { key: ["livree"], label: "Colis remis au destinataire" },
];

export default async function BookingPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser(["gp", "admin", "merchant"]);
  const b = gp.getBooking(user, Number((await params).id));
  if (!b) notFound();
  const { ok } = await searchParams;
  const country = countryOf(user);
  const isSender = user.role === "merchant";
  const isGp = user.role === "gp";
  const isAdmin = user.role === "admin";
  const visible = gp.contactsVisible(b);
  const settings = gp.gpSettings(user.companyId);
  const transportPrice = Math.ceil((b.weight_grams / 1000) * b.price_per_kg);
  const methods = country.paymentMethods.filter((m) => m.kind === "mobile_money").map((m) => ({ code: m.code, name: m.label }));

  return (
    <>
      <PageHeader
        title={`Réservation ${b.reference}`}
        description={`${b.origin_city} (${shippingCountryName(b.origin_country)}) → ${b.destination_city} (${shippingCountryName(b.destination_country)}) · départ ${formatDay(b.departure_date)}`}
        back={isAdmin ? { href: "/gp", label: "GP voyageurs" } : isGp ? { href: `/gp/voyages/${b.trip_id}`, label: "Mon voyage" } : { href: "/gp", label: "Envoi par GP" }}
      />
      <OkBanner code={ok} messages={OK} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          {b.status === "annulee" ? <Alert tone="warning">Cette réservation est annulée.</Alert> : null}

          {/* Paiement des frais (expéditeur) */}
          {isSender && b.status === "a_payer" ? (
            <Card title="Étape suivante : payer les frais de mise en relation">
              <div className="space-y-4">
                {b.admin_note ? <Alert tone="danger">Paiement non retrouvé : {b.admin_note}</Alert> : null}
                <div className="rounded-xl bg-brand-50 p-4">
                  <p className="text-sm text-brand-800">Montant à envoyer</p>
                  <p className="text-2xl font-bold text-brand-800">{formatMoney(b.fee, country)}</p>
                  {settings.paymentInfo ? <p className="mt-2 whitespace-pre-line text-sm font-semibold text-brand-900">{settings.paymentInfo}</p> : null}
                  <p className="mt-2 text-xs text-brand-800/80">Indiquez « {b.reference} » comme motif si c'est possible.</p>
                </div>
                <p className="text-sm text-ink-soft">Après l'envoi, indiquez ci-dessous le moyen utilisé et la référence du transfert (dans le SMS de confirmation).</p>
                <DeclarePaymentForm id={b.id} methods={methods} />
              </div>
            </Card>
          ) : null}
          {isSender && b.status === "a_verifier" ? (
            <Alert tone="info">
              Paiement déclaré ({paymentMethodLabel(country, b.payment_method)}, réf. {b.payment_reference}). Il est en cours de vérification : vous recevrez le contact du GP dès sa
              confirmation.
            </Alert>
          ) : null}

          {/* Vérification (administrateur) */}
          {isAdmin && (b.status === "a_verifier" || b.status === "a_payer") ? (
            <Card title="Vérification du paiement">
              <p className="mb-3 text-sm text-ink-soft">
                {b.status === "a_verifier"
                  ? `Déclaré le ${formatDateTime(b.payment_declared_at, country)} : ${formatMoney(b.fee, country)} par ${paymentMethodLabel(country, b.payment_method)}, réf. ${b.payment_reference}.`
                  : "L'expéditeur n'a pas encore déclaré de paiement."}
              </p>
              <PaymentDecision id={b.id} label={b.reference} />
            </Card>
          ) : null}

          {/* Contacts dévoilés après confirmation */}
          {visible && (isSender || isAdmin) && b.gp_phone ? (
            <Card title="Votre GP">
              <p className="text-lg font-semibold text-ink">{b.gp_name}</p>
              <p className="mb-3 text-sm text-ink-muted">{formatPhone(b.gp_phone, country)}</p>
              <ContactButtons
                phone={b.gp_phone}
                message={`Bonjour ${b.gp_name}, j'ai réservé ${gp.formatWeight(b.weight_grams)} sur votre voyage ${b.origin_city} → ${b.destination_city} du ${formatDay(b.departure_date)} (réservation ${b.reference}).`}
              />
              <DefinitionList
                items={[
                  ["Lieu de dépôt", b.dropoff_place ?? "À convenir avec le GP"],
                  ["Dernier jour de dépôt", b.deadline_date ? formatDay(b.deadline_date) : "À convenir avec le GP"],
                ]}
              />
            </Card>
          ) : null}
          {visible && (isGp || isAdmin) && b.sender_phone ? (
            <Card title="Expéditeur">
              <p className="text-lg font-semibold text-ink">{b.sender_name}</p>
              <p className="mb-3 text-sm text-ink-muted">{formatPhone(b.sender_phone, country)}</p>
              <ContactButtons phone={b.sender_phone} message={`Bonjour ${b.sender_name}, je suis ${b.gp_name}, votre GP pour ${b.origin_city} → ${b.destination_city} (réservation ${b.reference}).`} />
            </Card>
          ) : null}
          {isGp && !visible && b.status !== "annulee" ? (
            <Alert tone="info">Les coordonnées de l'expéditeur vous seront communiquées dès que les frais de mise en relation seront confirmés.</Alert>
          ) : null}

          {/* Note */}
          {isSender && b.status === "livree" && !b.rating ? (
            <Card title="Votre avis">
              <RateGpForm id={b.id} gpName={b.gp_name} />
            </Card>
          ) : null}
          {b.rating ? (
            <Card title="Avis de l'expéditeur">
              <p className="flex items-center gap-1" aria-label={`${b.rating} sur 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-5 w-5 ${n <= b.rating! ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
                ))}
              </p>
              {b.rating_comment ? <p className="mt-1 text-sm text-ink-soft">« {b.rating_comment} »</p> : null}
            </Card>
          ) : null}

          <BookingButtons
            id={b.id}
            canDeliver={b.status === "confirmee"}
            canCancel={(isSender && (b.status === "a_payer" || b.status === "a_verifier")) || (isAdmin && b.status !== "annulee" && b.status !== "livree")}
          />
        </div>

        <div className="space-y-5">
          <Card title="Suivi" actions={<BookingBadge status={b.status} />}>
            <ol className="space-y-3">
              {STEPS.map((s) => {
                const done = s.key.includes(b.status);
                return (
                  <li key={s.label} className="flex items-center gap-2 text-sm">
                    {done ? <CheckCircle2 className="h-5 w-5 text-brand-600" aria-hidden /> : <Circle className="h-5 w-5 text-slate-300" aria-hidden />}
                    <span className={done ? "font-semibold text-ink" : "text-ink-muted"}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
          </Card>
          <Card title="Le colis">
            <DefinitionList
              items={[
                ["Poids", gp.formatWeight(b.weight_grams)],
                ["Contenu", b.description],
                ["Destinataire", `${b.recipient_name}${b.recipient_city ? ` · ${b.recipient_city}` : ""}`],
                ...((b.recipient_phone ? [["Téléphone du destinataire", formatPhone(b.recipient_phone, country)]] : []) as [string, string][]),
                ["Prix du transport", `≈ ${gp.moneyIn(transportPrice, b.currency)} (${gp.pricePerKgLabel(b)}), à régler au GP`],
                ["Frais de mise en relation", b.fee ? formatMoney(b.fee, country) : "Gratuit"],
                ...(isAdmin ? ([["Expéditeur", `${b.sender_name}`], ["GP", b.gp_name]] as [string, string][]) : []),
                ["Réservé le", formatDateTime(b.created_at, country)],
              ]}
            />
            <Link href={`/gp/voyages/${b.trip_id}`} className="link mt-3 inline-block text-sm">
              Voir le voyage
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
