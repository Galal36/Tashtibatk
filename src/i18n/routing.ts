import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// Arabic is the default and is shown WITHOUT a /ar prefix is NOT used here —
// we keep an explicit prefix for every locale so hreflang/sitemap URLs are
// unambiguous (/ar, /en, /ur). RTL locales: ar, ur.
export const locales = ["ar", "en", "ur"] as const;
export const defaultLocale = "ar" as const;
export const rtlLocales = ["ar", "ur"];

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
