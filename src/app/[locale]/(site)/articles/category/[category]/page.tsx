import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getArticlesPage, getCategories } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pagination } from "@/components/Pagination";
import { locales } from "@/i18n/routing";
import { abs, alternatesFor } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: { locale: string; category: string }; searchParams: { page?: string } };

const pageNumber = (raw?: string) => {
  const n = Number(raw ?? 1);
  return Number.isInteger(n) && n >= 1 ? n : 0;
};

/** Category name: from the public category list, or (for hidden categories
 *  such as "others") from the articles themselves. */
async function load(locale: string, category: string, page: number) {
  const [data, categories] = await Promise.all([
    getArticlesPage(locale, page, category),
    getCategories(locale),
  ]);
  if (!data || data.results.length === 0) return null;
  const name =
    categories.find((c) => c.slug === category)?.name ?? data.results[0].category_name ?? category;
  return { data, name };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const page = pageNumber(searchParams.page) || 1;
  const loaded = await load(params.locale, params.category, page);
  if (!loaded) return {};
  const t = await getTranslations({ locale: params.locale, namespace: "articles" });
  const title = t("categoryTitle", { category: loaded.name });
  const path = `/articles/category/${params.category}`;
  // hreflang only to languages that really have articles in this category
  const withArticles = page > 1 ? [] : (
    await Promise.all(
      locales.map(async (l) => ((await getArticlesPage(l, 1, params.category))?.results.length ? l : null)),
    )
  ).filter((l): l is (typeof locales)[number] => !!l);
  return {
    title: page > 1 ? t("pageTitle", { title, page }) : title,
    description: t("categorySubtitle", { category: loaded.name }),
    alternates: page > 1
      ? { canonical: abs(`/${params.locale}${path}?page=${page}`) }
      : alternatesFor(params.locale, Object.fromEntries(withArticles.map((l) => [l, `/${l}${path}`]))),
  };
}

export default async function CategoryArticles({ params, searchParams }: Props) {
  const { locale, category } = params;
  setRequestLocale(locale);
  const page = pageNumber(searchParams.page);
  if (!page) notFound();
  const loaded = await load(locale, category, page);
  if (!loaded) notFound();
  const { data, name } = loaded;

  const t = await getTranslations("articles");
  const tNav = await getTranslations("nav");
  const title = t("categoryTitle", { category: name });

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white bg-grid">
        <div className="container py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: t("title"), href: "/articles" },
              { label: name },
            ]}
          />
          <h1 className="text-4xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            {t("categorySubtitle", { category: name })}
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((a) => (
            <ArticleCard key={a.id} article={a} locale={locale} />
          ))}
        </div>
        <Pagination
          basePath={`/articles/category/${category}`}
          page={page}
          totalPages={data.totalPages}
          labels={{ previous: t("previous"), next: t("next"), nav: t("paginationNav") }}
        />
      </section>
    </>
  );
}
