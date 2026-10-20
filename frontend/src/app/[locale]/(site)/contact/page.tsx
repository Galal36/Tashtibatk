import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCategories } from "@/lib/api";
import { WhatsApp, Mail, Clock, MapPin } from "@/components/Icon";
import { site, whatsappLink } from "@/lib/site";

export const revalidate = 600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";

type Props = {
  params: { locale: string };
  searchParams: { service?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "contact" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${SITE}/${params.locale}/contact`,
      languages: { ar: "/ar/contact", en: "/en/contact", ur: "/ur/contact" },
    },
  };
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tNav = await getTranslations("nav");
  const categories = await getCategories(locale);

  const services = categories.map((c) => ({ slug: c.slug, name: c.name }));
  const defaultService =
    services.find((s) => s.slug === searchParams.service)?.name ?? "";

  const details = [
    { icon: WhatsApp, label: t("whatsappLabel"), value: t("whatsappLabel"), href: whatsappLink(), ltr: false, green: true },
    { icon: Mail, label: t("emailLabel"), value: site.email, href: `mailto:${site.email}`, ltr: true },
    { icon: Clock, label: t("hoursLabel"), value: t("hoursValue") },
    { icon: MapPin, label: t("areaLabel"), value: t("areaValue") },
  ];

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-brand-50/60 to-white bg-grid">
        <div className="container py-12 sm:py-16">
          <Breadcrumbs items={[{ label: tNav("home"), href: "/" }, { label: t("title") }]} />
          <h1 className="text-4xl font-extrabold text-slate-900">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{t("subtitle")}</p>
        </div>
      </section>

      <section className="container grid gap-10 py-14 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="card p-6 sm:p-8">
            <ContactForm services={services} defaultService={defaultService} />
          </div>
        </div>

        {/* Contact details */}
        <aside className="lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">{t("infoTitle")}</h2>
            <ul className="mt-6 space-y-5">
              {details.map(({ icon: Glyph, label, value, href, ltr, green }) => {
                const inner = (
                  <>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${green ? "bg-green-50 text-green-600" : "bg-brand-50 text-brand-600"}`}>
                      <Glyph width={20} height={20} />
                    </span>
                    <span>
                      <span className="block text-xs font-medium text-slate-400">{label}</span>
                      <span className="block font-semibold text-slate-800" dir={ltr ? "ltr" : undefined}>
                        {value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a href={href} target={green ? "_blank" : undefined} rel="noopener" className="flex items-center gap-4 hover:opacity-80">
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
