"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { FormState } from "@/lib/validation";
import { Alert, cx } from "./ui";

export type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel = "Enregistrement…",
  name,
  value,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} name={name} value={value} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Message de résultat d'une action (succès ou erreur). */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  return <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>;
}

/**
 * Formulaire lié à une action serveur : affiche le message renvoyé et
 * l'état de chargement. Les champs sont passés en enfants.
 */
export function ActionForm({
  action,
  children,
  className,
  hidden,
  resetOnSuccess,
}: {
  action: FormAction;
  children: React.ReactNode | ((state: FormState) => React.ReactNode);
  className?: string;
  hidden?: Record<string, string | number>;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cx("space-y-3", className)} noValidate>
      {hidden ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
      <FormMessage state={state} />
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}

/**
 * Bouton qui demande confirmation dans une fenêtre avant d'envoyer le
 * formulaire parent. À placer DANS un <form>.
 */
export function ConfirmSubmit({
  label,
  title,
  message,
  confirmLabel,
  className = "btn-secondary",
  tone = "primary",
  icon,
}: {
  label: React.ReactNode;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  tone?: "primary" | "danger";
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { pending } = useFormStatus();
  return (
    <>
      <button type="button" className={className} disabled={pending} onClick={() => ref.current?.showModal()}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
        {label}
      </button>
      <dialog
        ref={ref}
        className="w-[min(92vw,26rem)] rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="p-5">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <div className="mt-2 text-sm text-ink-soft">{message}</div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => ref.current?.close()}>
              Retour
            </button>
            <button
              type="button"
              className={tone === "danger" ? "btn-danger" : "btn-primary"}
              onClick={() => {
                const form = ref.current?.closest("form");
                ref.current?.close();
                form?.requestSubmit();
              }}
            >
              {confirmLabel ?? "Confirmer"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/* ---------- Champs ---------- */

export function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">
        {label}
        {required ? <span className="text-red-600"> *</span> : <span className="font-normal text-ink-muted"> (facultatif)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function inputProps(name: string, state: FormState, defaults: Record<string, string> = {}) {
  const error = state.errors?.[name];
  return {
    id: name,
    name,
    defaultValue: state.values?.[name] ?? defaults[name] ?? "",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
    className: cx("input", error && "input-error"),
  };
}

/* ---------- Photo de preuve (compressée dans le navigateur) ---------- */

async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 400_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob ? new File([blob], "preuve.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // Le serveur refusera proprement si le format n'est pas pris en charge.
  }
}

export function PhotoInput({ name = "photo", id, label = "Photo de preuve" }: { name?: string; id?: string; label?: string }) {
  const inputId = id ?? name;
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label} <span className="font-normal text-ink-muted">(facultatif)</span>
      </label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return setPreview(null);
          setBusy(true);
          const small = await compress(f);
          if (small !== f && ref.current) {
            const dt = new DataTransfer();
            dt.items.add(small);
            ref.current.files = dt.files;
          }
          setPreview(URL.createObjectURL(small));
          setBusy(false);
        }}
      />
      {busy ? <p className="mt-1 text-xs text-ink-muted">Préparation de la photo…</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Aperçu de la photo" className="mt-2 h-32 w-auto rounded-lg border border-slate-200 object-cover" />
      ) : null}
    </div>
  );
}
