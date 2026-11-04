"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { t } from "@/lib/admin-strings";
import { useMe } from "./AdminAuth";

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  ),
  articles: (
    <path d="M4 4h16v2H4V4zm0 5h16v2H4V9zm0 5h10v2H4v-2zm0 5h10v2H4v-2z" />
  ),
  categories: (
    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
  ),
  media: (
    <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z" />
  ),
  users: (
    <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  ),
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
      {ICONS[name]}
    </svg>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { me, refresh } = useMe();
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) ?? "ar";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const base = `/${locale}/admin`;
  const nav = [
    { key: "dashboard", href: base, label: t.dashboard, icon: "dashboard" },
    { key: "articles", href: `${base}/articles`, label: t.articles, icon: "articles" },
    { key: "categories", href: `${base}/categories`, label: t.categories, icon: "categories" },
    { key: "media", href: `${base}/media`, label: t.media, icon: "media" },
    ...(me.role === "admin"
      ? [{ key: "users", href: `${base}/users`, label: t.users, icon: "users" }]
      : []),
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(href);
  }

  async function logout() {
    await adminApi.post("/api/auth/logout/");
    refresh();
  }

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          ت
        </div>
        <span className="text-lg font-bold text-slate-900">{t.brand}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
      <a
        href={`/${locale}`}
        target="_blank"
        rel="noreferrer"
        className="mx-3 mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
        </svg>
        {t.viewSite}
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-slate-200 bg-white lg:block">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 w-64 bg-white shadow-xl">
            {SidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:pr-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="menu"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:block">
              {me.full_name || me.email}
            </span>
            <button onClick={logout} className="btn-outline px-3 py-1.5 text-xs">
              {t.logout}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
