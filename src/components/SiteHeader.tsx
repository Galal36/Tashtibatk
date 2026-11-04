"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "./Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Phone, Menu, Close } from "./Icon";
import { telLink } from "@/lib/site";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tSite = useTranslations("site");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/services", label: t("services") },
    { href: "/articles", label: t("articles") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href="/" aria-label={tSite("name")} onClick={() => setOpen(false)}>
          <Logo name={tSite("name")} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={telLink()} className="btn-primary hidden sm:inline-flex">
            <Phone width={16} height={16} />
            {t("callNow")}
          </a>
          <div className="hidden md:block">
            <LocaleSwitcher current={locale} />
          </div>
          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          >
            {open ? <Close width={20} height={20} /> : <Menu width={20} height={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            <a href={telLink()} className="btn-primary mt-2">
              <Phone width={16} height={16} />
              {t("callNow")}
            </a>
            <div className="mt-3 px-1">
              <LocaleSwitcher current={locale} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
