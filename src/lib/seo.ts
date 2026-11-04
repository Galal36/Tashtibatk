/**
 * Shared SEO helpers: canonical + hreflang alternates and JSON-LD blocks.
 * All URLs are absolute (SITE) so they are unambiguous for crawlers.
 */
import type { Metadata } from "next";
import { locales, defaultLocale } from "@/i18n/routing";
import { site } from "@/lib/site";

export const SITE = site.url.replace(/\/$/, "");

/** Brand name per locale (also in messages/*.json → site.name). */
export const BRAND: Record<string, string> = { ar: "تشطيباتك", en: "Tashtibatk", ur: "Tashtibatk" };
export const brandFor = (locale: string) => BRAND[locale] ?? BRAND.en;

export const abs = (path: string) => `${SITE}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Self-referencing canonical + hreflang for every language version that exists.
 * `paths` maps locale -> path (without domain). x-default points to the Arabic
 * version when there is one.
 */
export function alternatesFor(
  locale: string,
  paths: Partial<Record<string, string>>,
): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    const p = paths[l];
    if (p) languages[l] = abs(p);
  }
  if (paths[defaultLocale]) languages["x-default"] = abs(paths[defaultLocale]!);
  return { canonical: abs(paths[locale] ?? "/"), languages };
}

/** Same path in every locale, e.g. "/articles" -> /ar/articles, /en/articles, /ur/articles. */
export const allLocales = (suffix: string, query = "") =>
  Object.fromEntries(locales.map((l) => [l, `/${l}${suffix}${query}`]));

/** Organization + LocalBusiness for the homepages. */
export function organizationJsonLd(locale: string, description: string) {
  const name = brandFor(locale);
  const org = `${SITE}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name,
        alternateName: Object.values(BRAND).filter((n) => n !== name),
        url: abs(`/${locale}`),
        logo: abs("/logo.jpg"),
        email: site.email,
        telephone: site.phone,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: site.phone,
          contactType: "customer service",
          areaServed: "KW",
          availableLanguage: ["ar", "en", "ur"],
        },
      },
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": `${SITE}/#localbusiness`,
        name,
        description,
        url: abs(`/${locale}`),
        logo: abs("/logo.jpg"),
        image: abs("/logo.jpg"),
        telephone: site.phone,
        email: site.email,
        areaServed: { "@type": "Country", name: "Kuwait" },
        address: { "@type": "PostalAddress", addressCountry: "KW" },
        parentOrganization: { "@id": org },
      },
    ],
  };
}

export type Crumb = { label: string; href?: string };

/** BreadcrumbList from the same items the visible breadcrumb shows. */
export function breadcrumbJsonLd(locale: string, items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: abs(`/${locale}${c.href === "/" ? "" : c.href}`) } : {}),
    })),
  };
}
