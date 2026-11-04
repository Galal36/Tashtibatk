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
  // Pages emit their own hreflang tags (lib/seo.ts). The middleware's Link
  // header assumes identical paths in every locale, which is wrong for
  // articles (different slug per language), so it is switched off.
  alternateLinks: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
