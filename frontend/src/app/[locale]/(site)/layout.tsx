import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingContact } from "@/components/FloatingContact";
import { getCategories } from "@/lib/api";

/**
 * Public-site chrome: header, footer and the floating contact buttons wrap
 * every visitor-facing page. The admin dashboard deliberately does NOT use
 * this layout.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const categories = await getCategories(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} />
      <FloatingContact />
    </div>
  );
}
