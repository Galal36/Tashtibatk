/**
 * Server-side data access to the Django API. These run on the Next server
 * (SSR/ISR), so they talk to the internal origin and are never bundled to
 * the browser. Public list/detail endpoints return only published content.
 */
const API = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8012";

type FetchOpts = { revalidate?: number };

async function get<T>(path: string, opts: FetchOpts = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: opts.revalidate ?? 300 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  language: string;
  category_name: string | null;
  featured_image: string | null;
  og_image: string | null;
  published_at: string | null;
}

export interface ArticleDetail extends ArticleListItem {
  body: string;
  canonical_url: string;
  effective_meta: { title: string; description: string; og_image: string | null };
  translations: Record<string, string>; // { en: "slug", ur: "slug" }
}

export interface ServicePageDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category_slug: string;
  effective_meta: { title: string; description: string; og_image: string | null };
}

type Paginated<T> = { results: T[] };

export const getCategories = (lang: string) =>
  get<Paginated<Category>>(`/api/categories/?lang=${lang}`).then((d) => d?.results ?? []);

export const getArticles = (lang: string, category?: string) =>
  get<Paginated<ArticleListItem>>(
    `/api/articles/?lang=${lang}${category ? `&category=${category}` : ""}`,
  ).then((d) => d?.results ?? []);

export const getArticle = (slug: string, lang: string) =>
  get<ArticleDetail>(`/api/articles/${slug}/?lang=${lang}`);

export const getServicePage = (slug: string, lang: string) =>
  get<ServicePageDetail>(`/api/service-pages/${slug}/?lang=${lang}`);
