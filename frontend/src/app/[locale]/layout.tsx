import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { locales, rtlLocales } from "@/i18n/routing";
import { TranslationProvider } from "@/components/TranslationContext";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010"),
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME ?? "Tashtibat",
    template: `%s · ${process.env.NEXT_PUBLIC_SITE_NAME ?? "Tashtibat"}`,
  },
};

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
