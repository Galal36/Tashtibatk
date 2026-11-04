import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { ArrowRight } from "./Icon";

/** Visible breadcrumb + matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const locale = useLocale();
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(locale, items)) }}
      />
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {c.href ? (
              <Link href={c.href} className="hover:text-brand-700">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700">{c.label}</span>
            )}
            {i < items.length - 1 && (
              <ArrowRight width={14} height={14} className="text-slate-300 rtl:rotate-180" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
