import { Link } from "@/i18n/routing";
import { ArrowRight } from "./Icon";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
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
