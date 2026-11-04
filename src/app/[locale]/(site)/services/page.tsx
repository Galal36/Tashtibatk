import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories } from "@/lib/api";
import { ServiceCard } from "@/components/ServiceCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const revalidate = 600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "services" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${SITE}/${params.locale}/services`,
      languages: { ar: "/ar/services", en: "/en/services", ur: "/ur/services" },
    },
  };
}

export default async function ServicesIndex({ params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tNav = await getTranslations("nav");
  const categories = await getCategories(locale);

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white bg-grid">
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]} />
          <h1 className="text-4xl font-extrabold text-slate-900">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{t("subtitle")}</p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <ServiceCard key={c.id} category={c} />
          ))}
        </div>
      </section>
    </>
  );
}
