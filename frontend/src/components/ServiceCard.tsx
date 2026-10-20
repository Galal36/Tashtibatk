import { Link } from "@/i18n/routing";
import { ServiceIcon, ArrowRight } from "./Icon";
import type { Category } from "@/lib/api";

export function ServiceCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/services/${category.slug}`}
      className="card card-hover group flex flex-col gap-4 p-6"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
        <ServiceIcon name={category.icon} width={24} height={24} />
      </span>
      <h3 className="text-base font-bold text-slate-900">{category.name}</h3>
      <span className="mt-auto inline-flex items-center text-brand-700 transition group-hover:gap-1">
        <ArrowRight width={18} height={18} className="rtl:rotate-180" />
      </span>
    </Link>
  );
}
