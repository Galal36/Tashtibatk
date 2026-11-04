import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getArticles, getCategories, getServicePage } from "@/lib/api";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleCard } from "@/components/ArticleCard";
import { ServiceIcon, ArrowRight, Phone, WhatsApp, Check } from "@/components/Icon";
import { site, telLink, whatsappLink } from "@/lib/site";

export const revalidate = 600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Tashtibat";
const COUNTRY = process.env.NEXT_PUBLIC_SITE_COUNTRY ?? "";

type Props = { params: { slug: string; locale: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getServicePage(params.slug, params.locale);
  if (!page) return {};
  return {
    title: page.effective_meta.title,
    description: page.effective_meta.description,
    alternates: {
      canonical: `${SITE}/${params.locale}/services/${params.slug}`,
      languages: {
        ar: `/ar/services/${params.slug}`,
        en: `/en/services/${params.slug}`,
        ur: `/ur/services/${params.slug}`,
      },
    },
    openGraph: {
      title: page.effective_meta.title,
      description: page.effective_meta.description,
      images: page.effective_meta.og_image ? [page.effective_meta.og_image] : [],
      type: "website",
    },
  };
}

export default async function ServicePageView({ params }: Props) {
  const { slug, locale } = params;
  setRequestLocale(locale);
  const [page, categories, related] = await Promise.all([
    getServicePage(slug, locale),
    getCategories(locale),
    getArticles(locale, slug),
  ]);
  if (!page) notFound();

  const t = await getTranslations("services");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const category = categories.find((c) => c.slug === page.category_slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.effective_meta.description,
    serviceType: page.title,
    areaServed: COUNTRY ? { "@type": "Country", name: COUNTRY } : undefined,
    provider: { "@type": "LocalBusiness", name: SITE_NAME, url: SITE },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white bg-grid">
        <div className="container py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: tNav("home"), href: "/" },
              { label: t("title"), href: "/services" },
              { label: page.title },
            ]}
          />
          <div className="flex items-start gap-5">
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white shadow-card sm:grid">
              <ServiceIcon name={category?.icon ?? "home"} width={32} height={32} />
            </span>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900">{page.title}</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                {page.effective_meta.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body + sidebar */}
      <section className="container grid gap-10 py-14 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="article-body whitespace-pre-line">{page.description}</div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/contact?service=${slug}`} className="btn-primary btn-lg">
              {t("request")}
              <ArrowRight width={18} height={18} className="rtl:rotate-180" />
            </Link>
            <a href={whatsappLink(page.title)} target="_blank" rel="noopener" className="btn-outline btn-lg">
              <WhatsApp width={18} height={18} className="text-green-600" />
              {tCommon("whatsapp")}
            </a>
          </div>
        </div>

        {/* Request card */}
        <aside className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h3 className="text-lg font-bold text-slate-900">{t("request")}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{tCommon("getQuote")}</p>
            <div className="mt-5 space-y-3">
              <a href={telLink()} className="btn-primary w-full" dir="ltr">
                <Phone width={16} height={16} />
                {site.phone}
              </a>
              <a href={whatsappLink(page.title)} target="_blank" rel="noopener" className="btn w-full bg-green-500 text-white hover:bg-green-600">
                <WhatsApp width={16} height={16} />
                {tCommon("whatsapp")}
              </a>
            </div>
            <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check width={16} height={16} className="text-green-600" />{t("subtitle")}</li>
            </ul>
          </div>
        </aside>
      </section>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/60 py-14">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">{t("related")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((a) => (
                <ArticleCard key={a.id} article={a} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
