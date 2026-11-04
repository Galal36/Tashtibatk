import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "./Logo";
import { WhatsApp, Mail, MapPin } from "./Icon";
import { site, whatsappLink } from "@/lib/site";
import type { Category } from "@/lib/api";

export function SiteFooter({ categories }: { categories: Category[] }) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tSite = useTranslations("site");
  const tContact = useTranslations("contact");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Logo name={tSite("name")} />
          <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
            {tSite("tagline")}
          </p>
        </div>

        {/* Services */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            {t("servicesCol")}
          </h3>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link href={`/services/${c.slug}`} className="text-slate-600 hover:text-brand-700">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            {t("quickLinks")}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="text-slate-600 hover:text-brand-700">{tNav("home")}</Link></li>
            <li><Link href="/services" className="text-slate-600 hover:text-brand-700">{tNav("services")}</Link></li>
            <li><Link href="/articles" className="text-slate-600 hover:text-brand-700">{tNav("articles")}</Link></li>
            <li><Link href="/contact" className="text-slate-600 hover:text-brand-700">{tNav("contact")}</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            {t("contactCol")}
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <a href={whatsappLink()} className="flex items-center gap-2.5 hover:text-brand-700" target="_blank" rel="noopener">
                <WhatsApp width={18} height={18} className="text-green-600 shrink-0" />
                <span>{tContact("whatsappLabel")}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2.5 hover:text-brand-700" dir="ltr">
                <Mail width={18} height={18} className="text-brand-600 shrink-0" />
                <span>{site.email}</span>
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin width={18} height={18} className="text-brand-600 shrink-0" />
              <span>{tContact("areaValue")}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container py-5 text-center text-xs text-slate-500">
          © {year} {tSite("name")}. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
