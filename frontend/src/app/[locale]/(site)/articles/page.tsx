import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getArticlesPage, getCategories } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { abs, alternatesFor, allLocales } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: { locale: string }; searchParams: { page?: string } };

const pageNumber = (raw?: string) => {
  const n = Number(raw ?? 1);
  return Number.isInteger(n) && n >= 1 ? n : 0;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "articles" });
  const page = pageNumber(searchParams.page) || 1;
  return {
    title: page > 1 ? t("pageTitle", { title: t("title"), page }) : t("title"),
    description: t("subtitle"),
    // Page N differs per language (different article counts): self-canonical only.
    alternates: page > 1
      ? { canonical: abs(`/${params.locale}/articles?page=${page}`) }
      : alternatesFor(params.locale, allLocales("/articles")),
  };
}

export default async function ArticlesIndex({ params, searchParams }: Props) {
  const { locale } = params;
  setRequestLocale(locale);
  const page = pageNumber(searchParams.page);
  if (!page) notFound();

  const t = await getTranslations("articles");
  const tNav = await getTranslations("nav");
  const [data, categories] = await Promise.all([getArticlesPage(locale, page), getCategories(locale)]);
  if (!data) notFound();

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white bg-grid">
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]} />
          <h1 className="text-4xl font-extrabold text-slate-900">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{t("subtitle")}</p>
          {categories.length > 0 && (
            <nav aria-label={t("byCategory")} className="mt-8">
              <p className="mb-3 text-sm font-semibold text-slate-700">{t("byCategory")}</p>
              <ul className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/articles/category/${c.slug}`} className="btn-outline btn-sm">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <section className="container py-14">
        {data.results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((a) => (
              <ArticleCard key={a.id} article={a} locale={locale} />
            ))}
          </div>
        )}
        <Pagination
          basePath="/articles"
          page={page}
          totalPages={data.totalPages}
          labels={{ previous: t("previous"), next: t("next"), nav: t("paginationNav") }}
        />
      </section>
    </>
  );
}
