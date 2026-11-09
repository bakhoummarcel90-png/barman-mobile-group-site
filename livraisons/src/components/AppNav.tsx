"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Banknote,
  Bike,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Store,
  Truck,
  UserCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/constants";
import { cx } from "./ui";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<Role, Item[]> = {
  admin: [
    { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/commandes", label: "Commandes", icon: ClipboardList },
    { href: "/livraisons", label: "Livraisons", icon: Truck },
    { href: "/encaissements", label: "Encaissements", icon: Banknote },
    { href: "/livreurs", label: "Livreurs", icon: Bike },
    { href: "/commercants", label: "Commerçants", icon: Store },
    { href: "/parametres", label: "Paramètres", icon: Settings },
  ],
  merchant: [
    { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/commandes", label: "Commandes", icon: ClipboardList },
    { href: "/livraisons", label: "Suivi", icon: Truck },
    { href: "/encaissements", label: "Paiements", icon: Banknote },
  ],
  courier: [
    { href: "/livraisons", label: "Aujourd'hui", icon: Truck },
    { href: "/commandes", label: "Historique", icon: ClipboardList },
    { href: "/encaissements", label: "Mon argent", icon: Banknote },
  ],
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  role,
  userName,
  roleLabel,
  companyName,
  logout,
}: {
  role: Role;
  userName: string;
  roleLabel: string;
  companyName: string;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  // Le menu se referme tout seul quand on change de page.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  const items = NAV[role];
  const bottom = items.slice(0, 4);

  const account = (
    <div className="border-t border-slate-200 p-3">
      <Link
        href="/mon-compte"
        className={cx(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-slate-100",
          isActive(pathname, "/mon-compte") && "bg-slate-100",
        )}
      >
        <UserCircle className="h-8 w-8 shrink-0 text-slate-400" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{userName}</span>
          <span className="block truncate text-xs text-ink-muted">{roleLabel}</span>
        </span>
      </Link>
      <form action={logout}>
        <button type="submit" className="btn-ghost mt-1 w-full justify-start">
          <LogOut className="h-4 w-4" aria-hidden /> Se déconnecter
        </button>
      </form>
    </div>
  );

  const links = (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navigation principale">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={cx(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            isActive(pathname, it.href) ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-slate-100",
          )}
          aria-current={isActive(pathname, it.href) ? "page" : undefined}
        >
          <it.icon className="h-5 w-5" aria-hidden />
          {it.label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <Truck className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-ink">SenLivraison</span>
        <span className="block truncate text-xs text-ink-muted">{companyName}</span>
      </span>
    </div>
  );

  return (
    <>
      {/* Ordinateur */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {links}
        {account}
      </aside>

      {/* Téléphone : barre du haut */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-2 backdrop-blur lg:hidden">
        {brand}
        <button type="button" className="btn-ghost" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </header>

      {/* Téléphone : menu complet */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            {links}
            {account}
          </div>
        </div>
      ) : null}

      {/* Téléphone : barre du bas */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ gridTemplateColumns: `repeat(${bottom.length}, minmax(0, 1fr))` }}
        aria-label="Navigation rapide"
      >
        {bottom.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cx(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              isActive(pathname, it.href) ? "text-brand-700" : "text-ink-muted",
            )}
            aria-current={isActive(pathname, it.href) ? "page" : undefined}
          >
            <it.icon className="h-6 w-6" aria-hidden />
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
