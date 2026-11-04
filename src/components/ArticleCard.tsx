import { Link } from "@/i18n/routing";
import type { ArticleListItem } from "@/lib/api";

function formatDate(iso: string | null, locale: string) {
  if (!iso) return null;
  try {
    const loc = locale === "ar" ? "ar-KW" : locale === "ur" ? "ur-PK" : "en-GB";
    return new Intl.DateTimeFormat(loc, {
      year: "numeric",
      month: "short",
      day: "numeric",
      calendar: "gregory",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function ArticleCard({
  article,
  locale,
}: {
  article: ArticleListItem;
  locale: string;
}) {
  const date = formatDate(article.published_at, locale);
  const cardImage = article.featured_image ?? article.og_image;
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {cardImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardImage}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
            <span className="px-6 text-center text-sm font-semibold text-white/90">
              {article.category_name}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {article.category_name && (
          <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {article.category_name}
          </span>
        )}
        <h3 className="text-lg font-bold leading-snug text-slate-900 transition group-hover:text-brand-700">
          {article.title}
        </h3>
        {date && <p className="mt-3 text-xs text-slate-400">{date}</p>}
      </div>
    </Link>
  );
}
