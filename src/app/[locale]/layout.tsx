import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { locales, rtlLocales } from "@/i18n/routing";
import { TranslationProvider } from "@/components/TranslationContext";
import { SITE, brandFor } from "@/lib/seo";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const brand = brandFor(params.locale);
  return {
    metadataBase: new URL(SITE),
    title: { default: brand, template: `%s · ${brand}` },
    openGraph: { siteName: brand },
  };
}

/**
 * Root locale layout — owns <html>/<body>, fonts and i18n/translation
 * providers ONLY. Public-site chrome (header/footer) lives in the (site)
 * route group; the admin dashboard lives in the (admin) group with its own
 * shell. Route groups don't affect URLs.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale as never)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={cairo.variable}>
      <body className="min-h-screen bg-white font-sans text-slate-800 antialiased">
        <NextIntlClientProvider messages={messages}>
          <TranslationProvider>{children}</TranslationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
