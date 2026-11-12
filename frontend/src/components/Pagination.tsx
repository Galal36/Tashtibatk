import { Link } from "@/i18n/routing";

/**
 * Crawlable pagination: plain <a href="…?page=N"> links (no JS), page 1 has
 * no query string so it matches the canonical URL.
 */
export function Pagination({
  basePath,
  page,
  totalPages,
  labels,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  labels: { previous: string; next: string; nav: string };
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label={labels.nav} className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="btn-outline">
          {labels.previous}
        </Link>
      )}
      {pages.map((p) =>
        p === page ? (
          <span key={p} aria-current="page" className="btn-primary min-w-10 justify-center">
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className="btn-outline min-w-10 justify-center">
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className="btn-outline">
          {labels.next}
        </Link>
      )}
    </nav>
  );
}
