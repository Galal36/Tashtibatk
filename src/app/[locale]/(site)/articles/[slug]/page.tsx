import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getArticle, getArticlesPage } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { alternatesFor, titleFor } from "@/lib/seo";
import { ArticleTranslationSync } from "@/components/TranslationContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowRight, WhatsApp } from "@/components/Icon";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;

const OG_LOCALE: Record<string, string> = { ar: "ar", en: "en", ur: "ur" };

type Props = { params: { slug: string; locale: string } };

function formatDate(iso: string | null, locale: string) {
  if (!iso) return null;
  try {
    const loc = locale === "ar" ? "ar-KW" : locale === "ur" ? "ur-PK" : "en-GB";
    return new Intl.DateTimeFormat(loc, {
      year: "numeric", month: "long", day: "numeric", calendar: "gregory",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug, params.locale);
  if (!article) return {};

  // self + every PUBLISHED translation (linked by translation_group)
  const paths: Record<string, string> = { [params.locale]: `/${params.locale}/articles/${params.slug}` };
  for (const [lang, slug] of Object.entries(article.translations)) {
    paths[lang] = `/${lang}/articles/${slug}`;
  }
  const alternates = alternatesFor(params.locale, paths)!;
  if (article.canonical_url) alternates.canonical = article.canonical_url;

  return {
    title: titleFor(article.effective_meta.title),
    description: article.effective_meta.description,
    alternates,
    openGraph: {
      title: article.effective_meta.title,
      description: article.effective_meta.description,
      images: article.effective_meta.og_image ? [article.effective_meta.og_image] : [],
      locale: OG_LOCALE[params.locale] ?? "en",
      type: "article",
      publishedTime: article.published_at ?? undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug, locale } = params;
  setRequestLocale(locale);
  const article = await getArticle(slug, locale);
  if (!article) notFound();

  const t = await getTranslations("articles");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const date = formatDate(article.published_at, locale);
  const related = article.category_slug
    ? ((await getArticlesPage(locale, 1, article.category_slug))?.results ?? [])
        .filter((a) => a.id !== article.id)
        .slice(0, 4)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.effective_meta.title,
    description: article.effective_meta.description,
    image: article.effective_meta.og_image ?? undefined,
    datePublished: article.published_at ?? undefined,
    inLanguage: locale,
  };

  return (
    <>
      <ArticleTranslationSync translations={article.translations} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="container max-w-3xl py-12">
        <Breadcrumbs
          items={[
            { label: tNav("home"), href: "/" },
            { label: t("title"), href: "/articles" },
            ...(article.category_slug && article.category_name
              ? [{ label: article.category_name, href: `/articles/category/${article.category_slug}` }]
              : []),
            { label: article.title },
          ]}
        />

        <header>
          {article.category_name && (
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              {article.category_name}
            </span>
          )}
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-slate-900">
            {article.title}
          </h1>
          {date && <p className="mt-4 text-sm text-slate-400">{date}</p>}
        </header>

        {article.og_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.og_image}
            alt={article.title}
            className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
          />
        )}

        {/* body is sanitized server-side (nh3) before it ever reaches here */}
        <div
          className="article-body mt-8"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Inline CTA */}
        <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-center sm:p-8">
          <p className="text-lg font-bold text-slate-900">{tCommon("getQuote")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">
              {tNav("contact")}
              <ArrowRight width={16} height={16} className="rtl:rotate-180" />
            </Link>
            <a href={whatsappLink(article.title)} target="_blank" rel="noopener" className="btn-outline">
              <WhatsApp width={16} height={16} className="text-green-600" />
              {tCommon("whatsapp")}
            </a>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/60 py-14">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">{t("related")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
