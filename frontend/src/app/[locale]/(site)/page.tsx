import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getArticles, getCategories } from "@/lib/api";
import { ServiceCard } from "@/components/ServiceCard";
import { ArticleCard } from "@/components/ArticleCard";
import {
  ServiceIcon, ArrowRight, Check, Shield, Clock24, Wallet, WhatsApp,
} from "@/components/Icon";
import { whatsappLink } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tHero = await getTranslations("hero");

  const [categories, articles] = await Promise.all([
    getCategories(locale),
    getArticles(locale),
  ]);

  const why = [
    { icon: Shield, t: t("why.licensedT"), d: t("why.licensedD") },
    { icon: Clock24, t: t("why.fastT"), d: t("why.fastD") },
    { icon: Wallet, t: t("why.fairT"), d: t("why.fairD") },
    { icon: WhatsApp, t: t("why.supportT"), d: t("why.supportD") },
  ];
  const steps = [
    { t: t("how.step1T"), d: t("how.step1D") },
    { t: t("how.step2T"), d: t("how.step2D") },
    { t: t("how.step3T"), d: t("how.step3D") },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-grid">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 to-white" />
        <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow">{tHero("badge")}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] text-slate-900 sm:text-5xl">
              {tHero("title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              {tHero("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary btn-lg">
                {tHero("primary")}
                <ArrowRight width={18} height={18} className="rtl:rotate-180" />
              </Link>
              <Link href="/services" className="btn-outline btn-lg">
                {tHero("secondary")}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {[tHero("b1"), tHero("b2"), tHero("b3")].map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Check width={18} height={18} className="text-green-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative service-icon panel */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((c, i) => (
                <div
                  key={c.id}
                  className={`card flex items-center gap-3 p-5 ${i % 2 ? "translate-y-6" : ""}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <ServiceIcon name={c.icon} width={22} height={22} />
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section id="services" className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{t("servicesTitle")}</h2>
            <p className="mt-2 text-slate-600">{t("servicesSub")}</p>
          </div>
          <Link href="/services" className="btn-ghost">
            {t("viewAllServices")}
            <ArrowRight width={16} height={16} className="rtl:rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <ServiceCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold">{t("whyTitle")}</h2>
            <p className="mt-2 text-slate-600">{t("whySub")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(({ icon: Glyph, t: title, d }) => (
              <div key={title} className="card p-6 text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                  <Glyph width={26} height={26} />
                </span>
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">{t("howTitle")}</h2>
          <p className="mt-2 text-slate-600">{t("howSub")}</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.t} className="relative text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-500 text-xl font-extrabold text-white shadow-card">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{s.t}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Latest articles ──────────────────────────────────── */}
      {articles.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/60 py-16 sm:py-20">
          <div className="container">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold">{t("articlesTitle")}</h2>
                <p className="mt-2 text-slate-600">{t("articlesSub")}</p>
              </div>
              <Link href="/articles" className="btn-ghost">
                {t("viewAllArticles")}
                <ArrowRight width={16} height={16} className="rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 3).map((a) => (
                <ArticleCard key={a.id} article={a} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section className="container py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-center sm:px-16">
          <div className="absolute inset-0 -z-0 bg-grid opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{t("ctaSub")}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-accent btn-lg">
                {t("ctaBtn")}
                <ArrowRight width={18} height={18} className="rtl:rotate-180" />
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener"
                className="btn btn-lg bg-white/10 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20"
              >
                <WhatsApp width={18} height={18} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
