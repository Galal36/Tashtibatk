/**
 * Browser-side, session-authenticated client for the Django API used by the
 * admin dashboard. Unlike `lib/api.ts` (server-side, public reads), this runs
 * in the browser, sends the session cookie, and attaches the CSRF token on
 * every unsafe request.
 */

const API = process.env.NEXT_PUBLIC_API_BASE ?? "";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

let csrfPrimed = false;

/** Ensure the csrftoken cookie exists before the first mutating request. */
async function ensureCsrf(): Promise<void> {
  if (csrfPrimed || getCookie("csrftoken")) {
    csrfPrimed = true;
    return;
  }
  await fetch(`${API}/api/auth/csrf/`, { credentials: "include" });
  csrfPrimed = true;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(typeof data === "string" ? data : `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

type Body = unknown;

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (unsafe) await ensureCsrf();

  const headers: Record<string, string> = {};
  if (unsafe) headers["X-CSRFToken"] = getCookie("csrftoken") ?? "";

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API}${path}`, {
    method,
    credentials: "include",
    headers,
    body: payload,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export const adminApi = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Body) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: Body) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, form),
  patchForm: <T>(path: string, form: FormData) => request<T>("PATCH", path, form),
};

// ─── Types ──────────────────────────────────────────────────────────────
export type Role = "admin" | "moderator";
export type ArticleStatus = "draft" | "published" | "scheduled" | "archived";
export type Lang = "ar" | "en" | "ur";

export interface Me {
  id: string;
  email: string;
  full_name: string;
  role: Role;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  language: Lang;
  status: ArticleStatus;
  category: string | null;
  category_name: string | null;
  author_name: string | null;
  featured_image: string | null;
  og_image: string | null;
  published_at: string | null;
  updated_at: string;
}

export interface AdminArticleDetail extends AdminArticle {
  author: string | null;
  body: string;
  featured_image_url: string | null;
  featured_image_alt: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  og_image_url: string | null;
  og_title: string;
  og_description: string;
  canonical_url: string;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_ur: string;
  description_ar: string;
  description_en: string;
  description_ur: string;
  image: string | null;
  image_url: string | null;
  icon: string;
  meta_title: string;
  meta_description: string;
  display_order: number;
  is_active: boolean;
  article_count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  file: string;
  url: string;
  title: string;
  alt_text: string;
  caption: string;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DashboardStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  categories: number;
  recent: AdminArticle[];
}
