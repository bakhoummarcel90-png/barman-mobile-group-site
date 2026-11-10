/*
 * Envoi d'e-mails transactionnels (code de vérification d'inscription).
 *
 * Fournisseur : Brevo (API HTTPS, offre gratuite ~300 e-mails/jour). L'API web
 * est utilisée plutôt que SMTP, souvent bloqué par les hébergeurs.
 *
 * Variables (chez l'hébergeur) :
 *   BREVO_API_KEY      clé API Brevo (Paramètres SMTP & API → Clés API)
 *   MAIL_FROM_EMAIL    adresse expéditeur VÉRIFIÉE dans Brevo (Expéditeurs)
 *   MAIL_FROM_NAME     nom affiché (facultatif, par défaut « SenLivraison »)
 * Sans BREVO_API_KEY et MAIL_FROM_EMAIL, aucun e-mail n'est envoyé et
 * l'inscription fonctionne sans code.
 *
 * Développement / tests uniquement : MAIL_OUTBOX_DIR=<dossier> écrit les
 * e-mails dans des fichiers au lieu de les envoyer.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface Mail {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
}

export function mailConfigured(): boolean {
  return !!(process.env.MAIL_OUTBOX_DIR || (process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL));
}

export class MailError extends Error {}

export async function sendMail(mail: Mail): Promise<void> {
  const outbox = process.env.MAIL_OUTBOX_DIR;
  if (outbox) {
    mkdirSync(outbox, { recursive: true });
    writeFileSync(path.join(outbox, `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}.json`), JSON.stringify(mail, null, 2));
    return;
  }
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM_EMAIL;
  if (!apiKey || !from) throw new MailError("L'envoi d'e-mails n'est pas configuré.");
  const res = await fetch(process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: process.env.MAIL_FROM_NAME || "SenLivraison" },
      to: [{ email: mail.to, ...(mail.toName ? { name: mail.toName } : {}) }],
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error("Brevo : envoi refusé", res.status, detail);
    throw new MailError("L'e-mail n'a pas pu être envoyé. Réessayez dans quelques minutes.");
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function verificationMail(to: string, name: string, code: string, companyName: string): Mail {
  return {
    to,
    toName: name,
    subject: `${code} — votre code de vérification ${companyName}`,
    text: `Bonjour ${name},\n\nVotre code de vérification est : ${code}\n\nSaisissez-le dans l'application pour confirmer votre inscription chez ${companyName}. Il est valable 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez ce message.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
  <h2 style="color:#0b8a6b">${escapeHtml(companyName)}</h2>
  <p>Bonjour ${escapeHtml(name)},</p>
  <p>Votre code de vérification est :</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#ecfdf6;padding:12px 16px;border-radius:12px;text-align:center">${code}</p>
  <p>Saisissez-le dans l'application pour confirmer votre inscription. Il est valable 15 minutes.</p>
  <p style="color:#64748b;font-size:13px">Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.</p>
</div>`,
  };
}
