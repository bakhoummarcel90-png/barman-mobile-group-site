import Link from "next/link";
import {
  Ban,
  Bike,
  CheckCircle2,
  CircleDashed,
  Inbox,
  Undo2,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { PAYMENT_STATUS_LABELS, STATUS_LABELS, type DeliveryStatus, type PaymentStatus } from "@/lib/constants";

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

const STATUS_STYLE: Record<DeliveryStatus, { cls: string; icon: LucideIcon }> = {
  a_attribuer: { cls: "bg-amber-50 text-amber-800 ring-amber-200", icon: Inbox },
  attribuee: { cls: "bg-sky-50 text-sky-800 ring-sky-200", icon: UserCheck },
  en_cours: { cls: "bg-violet-50 text-violet-800 ring-violet-200", icon: Bike },
  livree: { cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", icon: CheckCircle2 },
  echec: { cls: "bg-red-50 text-red-800 ring-red-200", icon: XCircle },
  retour_commercant: { cls: "bg-orange-50 text-orange-800 ring-orange-200", icon: Undo2 },
  annulee: { cls: "bg-slate-100 text-slate-600 ring-slate-200", icon: Ban },
};

export function StatusBadge({ status, className }: { status: DeliveryStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  const Icon = s.icon;
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", s.cls, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function statusIcon(status: DeliveryStatus): LucideIcon {
  return STATUS_STYLE[status].icon;
}

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  a_verifier: "bg-amber-50 text-amber-800 ring-amber-200",
  confirme: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ecart: "bg-red-50 text-red-800 ring-red-200",
  non_encaisse: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", PAYMENT_STYLE[status])}>
      {status === "a_verifier" ? <CircleDashed className="h-3.5 w-3.5" aria-hidden /> : null}
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-1 inline-block text-sm font-medium text-ink-muted hover:text-ink">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, className, id }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cx("card scroll-mt-20", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children }: { icon?: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <Icon className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
      <p className="font-semibold text-ink">{title}</p>
      {children ? <div className="mt-1 max-w-sm text-sm text-ink-muted">{children}</div> : null}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "danger"; children: React.ReactNode }) {
  const cls = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm", cls)}>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "default", href, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; tone?: "default" | "warning" | "danger" | "success" | "info"; href?: string; icon?: LucideIcon }) {
  const ring = {
    default: "text-ink",
    warning: "text-amber-700",
    danger: "text-red-700",
    success: "text-emerald-700",
    info: "text-violet-700",
  }[tone];
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon ? <Icon className={cx("h-5 w-5", ring)} aria-hidden /> : null}
      </div>
      <p className={cx("mt-2 text-2xl font-bold tabular-nums", ring)}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition hover:border-brand-200 hover:shadow-md">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

export function DefinitionList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{k}</dt>
          <dd className="mt-0.5 break-words text-sm text-ink">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ActiveBadge({ active }: { active: number | boolean }) {
  return active ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Actif</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">Désactivé</span>
  );
}

/** Bandeau de confirmation après une action redirigée (?ok=code). Seuls les codes connus sont affichés. */
export function OkBanner({ code, messages }: { code: string | string[] | undefined; messages: Record<string, string> }) {
  const key = Array.isArray(code) ? code[0] : code;
  if (!key || !messages[key]) return null;
  return (
    <div className="mb-4">
      <Alert tone="success">{messages[key]}</Alert>
    </div>
  );
}
