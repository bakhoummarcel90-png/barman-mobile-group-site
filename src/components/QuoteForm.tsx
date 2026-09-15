"use client";

import { useState, FormEvent } from "react";
import { CheckCircle2, Send, MessageCircle } from "lucide-react";
import { buildQuoteWhatsAppMessage, buildWhatsAppLink, type QuoteFormData } from "@/lib/whatsapp";
import { services } from "@/config/services";

const emptyData: QuoteFormData = {
  nom: "",
  telephone: "",
  whatsapp: "",
  email: "",
  typeClient: "Particulier",
  typeEvenement: "",
  date: "",
  lieu: "",
  invites: "",
  heureDebut: "",
  duree: "",
  services: [],
  formuleBoissons: "Avec alcool",
  produitsFournis: "Fournis par Barman Mobile",
  location: "Non",
  personnel: "",
  budget: "",
  message: "",
};

type Errors = Partial<Record<keyof QuoteFormData | "consent", string>>;

export default function QuoteForm() {
  const [data, setData] = useState<QuoteFormData>(emptyData);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  function update<K extends keyof QuoteFormData>(key: K, value: QuoteFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleService(name: string) {
    setData((d) => ({
      ...d,
      services: d.services.includes(name)
        ? d.services.filter((s) => s !== name)
        : [...d.services, name],
    }));
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!data.nom.trim()) next.nom = "Merci d'indiquer votre nom et prénom.";
    if (!data.telephone.trim()) next.telephone = "Un numéro de téléphone est nécessaire.";
    if (!data.typeEvenement.trim()) next.typeEvenement = "Précisez le type d'événement.";
    if (!data.date.trim()) next.date = "Merci d'indiquer la date de l'événement.";
    if (!data.invites.trim()) next.invites = "Indiquez un nombre d'invités approximatif.";
    if (!consent) next.consent = "Merci d'autoriser Barman Mobile Group à vous recontacter.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  }

  if (submitted) {
    const message = buildQuoteWhatsAppMessage(data);
    return (
      <div className="rounded-2xl border border-champagne/25 bg-nuit-soft p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-champagne" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl text-ivoire">Votre demande est prête</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ivoire/65">
          Voici le récapitulatif de votre demande. Envoyez-le nous directement sur WhatsApp pour
          un traitement rapide, nous revenons vers vous dans les meilleurs délais.
        </p>
        <div className="mx-auto mt-6 max-w-lg rounded-xl border border-champagne/15 bg-nuit p-5 text-left text-sm text-ivoire/70 whitespace-pre-line">
          {message}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <a
            href={buildWhatsAppLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-medium text-nuit hover:bg-champagne-light"
          >
            <MessageCircle className="h-4 w-4" /> Envoyer sur WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="focus-ring text-sm text-ivoire/60 hover:text-ivoire"
          >
            Modifier ma demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-2 font-display text-xl text-ivoire sm:col-span-2">Vos coordonnées</legend>
        <Field label="Nom et prénom" required error={errors.nom}>
          <input className={inputClass} value={data.nom} onChange={(e) => update("nom", e.target.value)} />
        </Field>
        <Field label="Téléphone" required error={errors.telephone}>
          <input className={inputClass} value={data.telephone} onChange={(e) => update("telephone", e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <input className={inputClass} value={data.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input type="email" className={inputClass} value={data.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <Field label="Type de client">
          <select className={inputClass} value={data.typeClient} onChange={(e) => update("typeClient", e.target.value)}>
            {["Particulier", "Entreprise", "Institution", "Agence événementielle"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-2 font-display text-xl text-ivoire sm:col-span-2">Votre événement</legend>
        <Field label="Type d'événement" required error={errors.typeEvenement}>
          <input
            className={inputClass}
            placeholder="Mariage, anniversaire, séminaire..."
            value={data.typeEvenement}
            onChange={(e) => update("typeEvenement", e.target.value)}
          />
        </Field>
        <Field label="Date de l'événement" required error={errors.date}>
          <input type="date" className={inputClass} value={data.date} onChange={(e) => update("date", e.target.value)} />
        </Field>
        <Field label="Lieu">
          <input className={inputClass} value={data.lieu} onChange={(e) => update("lieu", e.target.value)} />
        </Field>
        <Field label="Nombre d'invités" required error={errors.invites}>
          <input className={inputClass} value={data.invites} onChange={(e) => update("invites", e.target.value)} />
        </Field>
        <Field label="Heure de début">
          <input type="time" className={inputClass} value={data.heureDebut} onChange={(e) => update("heureDebut", e.target.value)} />
        </Field>
        <Field label="Durée souhaitée">
          <input className={inputClass} placeholder="Ex : 4 heures" value={data.duree} onChange={(e) => update("duree", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-display text-xl text-ivoire">Services demandés</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <label
              key={s.slug}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-champagne/15 bg-nuit-soft px-4 py-3 text-sm text-ivoire/75"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-champagne"
                checked={data.services.includes(s.shortName)}
                onChange={() => toggleService(s.shortName)}
              />
              {s.shortName}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-2 font-display text-xl text-ivoire sm:col-span-2">Précisions</legend>
        <Field label="Boissons souhaitées">
          <select className={inputClass} value={data.formuleBoissons} onChange={(e) => update("formuleBoissons", e.target.value)}>
            {["Avec alcool", "Sans alcool", "Formule mixte"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Produits">
          <select className={inputClass} value={data.produitsFournis} onChange={(e) => update("produitsFournis", e.target.value)}>
            {["Fournis par Barman Mobile", "Fournis par le client", "Formule mixte"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Besoin de location de matériel">
          <select className={inputClass} value={data.location} onChange={(e) => update("location", e.target.value)}>
            {["Non", "Oui — verrerie", "Oui — mobilier", "Oui — plusieurs catégories"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Besoin en personnel">
          <input className={inputClass} placeholder="Ex : 2 barmans, 4 serveurs" value={data.personnel} onChange={(e) => update("personnel", e.target.value)} />
        </Field>
        <Field label="Budget indicatif">
          <input className={inputClass} placeholder="Optionnel" value={data.budget} onChange={(e) => update("budget", e.target.value)} />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-display text-xl text-ivoire">Votre message</legend>
        <textarea
          className={`${inputClass} min-h-32`}
          placeholder="Précisez tout élément utile à votre demande..."
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-ivoire/65">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-champagne"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) {
              setErrors((current) => ({ ...current, consent: undefined }));
            }
          }}
        />
        J'autorise Barman Mobile Group à me recontacter au sujet de ma demande de devis.
      </label>
      {errors.consent && (
        <p className="text-sm text-terre-light">{errors.consent}</p>
      )}

      <button
        type="submit"
        className="focus-ring inline-flex items-center gap-2 rounded-full bg-champagne px-7 py-3.5 text-sm font-medium text-nuit hover:bg-champagne-light"
      >
        <Send className="h-4 w-4" /> Envoyer ma demande
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-champagne/20 bg-nuit px-4 py-2.5 text-sm text-ivoire placeholder:text-ivoire/30 focus:border-champagne focus:outline-none";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-ivoire/70">
        {label} {required && <span className="text-terre-light">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-terre-light">{error}</p>}
    </div>
  );
}
