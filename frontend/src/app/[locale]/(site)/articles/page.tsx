import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getArticles } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

type Props = { params: { locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "articles" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${SITE}/${params.locale}/articles`,
      languages: { ar: "/ar/articles", en: "/en/articles", ur: "/ur/articles" },
    },
  };
}

export default async function ArticlesIndex({ params }: Props) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations("articles");
  const tNav = await getTranslations("nav");
  const articles = await getArticles(locale);

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
        {articles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
