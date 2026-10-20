"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  adminApi,
  ApiError,
  type AdminArticleDetail,
  type AdminCategory,
  type Lang,
  type Paginated,
} from "@/lib/admin-api";
import { LANG_LABEL, t } from "@/lib/admin-strings";
import { Spinner, useToast } from "@/components/admin/ui";
import { RichEditor } from "./RichEditor";
import { FeaturedImage, type FeaturedValue } from "./FeaturedImage";
import { SeoPanel } from "./SeoPanel";

// ── slug helper ────────────────────────────────────────────────────────────
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // drop non-ascii (Arabic) → leaves latin words
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── form state ───────────────────────────────────────────────────────────
interface FormState {
  title: string;
  slug: string;
  body: string;
  language: Lang;
  category: string; // category id ("" = none)
  status: AdminArticleDetail["status"];
  published_at: string | null;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  og_title: string;
  og_description: string;
}

const EMPTY: FormState = {
  title: "",
  slug: "",
  body: "",
  language: "ar",
  category: "",
  status: "draft",
  published_at: null,
  meta_title: "",
  meta_description: "",
  focus_keyword: "",
  og_title: "",
  og_description: "",
};

const NO_FEATURED: FeaturedValue = { url: null, blob: null, alt: "", remove: false };

export function ArticleForm({ id }: { id?: string }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "ar";
  const base = `/${locale}/admin`;
  const { push } = useToast();

  const [articleId, setArticleId] = useState<string | undefined>(id);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [featured, setFeatured] = useState<FeaturedValue>(NO_FEATURED);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  const dirty = useRef(false);
  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    dirty.current = true;
  }

  // categories for the sidebar selector
  useEffect(() => {
    adminApi
      .get<Paginated<AdminCategory> | AdminCategory[]>("/api/categories/")
      .then((d) => setCategories(Array.isArray(d) ? d : d.results))
      .catch(() => {});
  }, []);

  // load existing article
  useEffect(() => {
    if (!id) return;
    adminApi
      .get<AdminArticleDetail>(`/api/articles/${id}/`)
      .then((a) => {
        setForm({
          title: a.title,
          slug: a.slug,
          body: a.body,
          language: a.language,
          category: a.category ?? "",
          status: a.status,
          published_at: a.published_at,
          meta_title: a.meta_title,
          meta_description: a.meta_description,
          focus_keyword: a.focus_keyword,
          og_title: a.og_title,
          og_description: a.og_description,
        });
        setFeatured({
          url: a.featured_image_url,
          blob: null,
          alt: a.featured_image_alt ?? "",
          remove: false,
        });
        if (a.published_at) setScheduleAt(toLocalInput(a.published_at));
      })
      .catch(() => push("تعذّر تحميل المقال", "err"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // auto-sync slug from title until the user edits the slug manually
  useEffect(() => {
    if (slugTouched) return;
    const s = slugify(form.title);
    if (s) setForm((f) => ({ ...f, slug: s }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, slugTouched]);

  // ── persistence ──────────────────────────────────────────────────────────
  const textPayload = useCallback(
    (overrides: Partial<FormState> = {}) => {
      const f = { ...form, ...overrides };
      const slug = f.slug || `post-${Date.now().toString(36)}`;
      return {
        title: f.title,
        slug,
        body: f.body,
        language: f.language,
        category: f.category || null,
        status: f.status,
        published_at: f.published_at,
        meta_title: f.meta_title,
        meta_description: f.meta_description,
        focus_keyword: f.focus_keyword,
        og_title: f.og_title,
        og_description: f.og_description,
        featured_image_alt: featured.alt,
        ...(featured.remove ? { featured_image: null } : {}),
      };
    },
    [form, featured],
  );

  /** Core save. Returns the persisted article id, or null on failure. */
  async function persist(overrides: Partial<FormState> = {}): Promise<string | null> {
    const payload = textPayload(overrides);
    if (!payload.title.trim()) {
      push("العنوان مطلوب", "err");
      return null;
    }
    setSaving(true);
    try {
      let savedId = articleId;
      if (savedId) {
        await adminApi.patch<AdminArticleDetail>(`/api/articles/${savedId}/`, payload);
      } else {
        const created = await adminApi.post<AdminArticleDetail>("/api/articles/", payload);
        savedId = created.id;
        setArticleId(savedId);
        // reflect server-side server defaults / cleaned slug
        setForm((f) => ({ ...f, slug: created.slug }));
        window.history.replaceState(null, "", `${base}/articles/${savedId}/edit`);
      }
      // featured image (multipart PATCH) after the text fields exist
      if (featured.blob && savedId) {
        const fd = new FormData();
        fd.append("featured_image", featured.blob, "featured.jpg");
        const updated = await adminApi.patchForm<AdminArticleDetail>(
          `/api/articles/${savedId}/`,
          fd,
        );
        setFeatured((v) => ({ ...v, url: updated.featured_image_url, blob: null }));
      }
      dirty.current = false;
      setSavedAt(new Date().toISOString());
      return savedId ?? null;
    } catch (e) {
      const msg =
        e instanceof ApiError && e.data && typeof e.data === "object"
          ? Object.values(e.data as Record<string, unknown>)
              .flat()
              .join(" · ")
          : "تعذّر الحفظ";
      push(String(msg), "err");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // ── status actions ───────────────────────────────────────────────────────
  async function saveDraft() {
    set("status", "draft");
    const okId = await persist({ status: "draft" });
    if (okId) push("تم حفظ المسودة ✓");
  }

  async function publishNow() {
    const now = new Date().toISOString();
    setForm((f) => ({ ...f, status: "published", published_at: f.published_at ?? now }));
    const okId = await persist({
      status: "published",
      published_at: form.published_at ?? now,
    });
    if (okId) push("تم النشر ✓");
  }

  async function schedule() {
    if (!scheduleAt) {
      push("اختر تاريخ النشر", "err");
      return;
    }
    const iso = new Date(scheduleAt).toISOString();
    if (new Date(iso) <= new Date()) {
      push("اختر وقتًا في المستقبل", "err");
      return;
    }
    setForm((f) => ({ ...f, status: "scheduled", published_at: iso }));
    const okId = await persist({ status: "scheduled", published_at: iso });
    if (okId) {
      setScheduleOpen(false);
      push("تمت الجدولة ✓");
    }
  }

  async function unpublish() {
    setForm((f) => ({ ...f, status: "draft" }));
    const okId = await persist({ status: "draft" });
    if (okId) push("تم إلغاء النشر ✓");
  }

  /** Save all current edits, preserving the existing status (WordPress "Update"). */
  async function update() {
    const okId = await persist();
    if (okId) push("تم تحديث المقال ✓");
  }

  // ── auto-save (existing drafts only, text-only) ──────────────────────────
  useEffect(() => {
    if (!articleId) return;
    const handle = setTimeout(() => {
      if (!dirty.current || saving) return;
      // never auto-flip a published/scheduled article; only autosave drafts
      if (form.status !== "draft") return;
      persist();
    }, 5000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, featured, articleId]);

  if (loading) return <Spinner />;

  const isPublished = form.status === "published";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.push(`${base}/articles`)} className="btn-ghost px-3 py-1.5 text-sm">
          ← {t.articles}
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {saving ? (
            <span className="text-amber-600">جارٍ الحفظ…</span>
          ) : savedAt ? (
            <span className="text-emerald-600">
              تم الحفظ ✓ {new Date(savedAt).toLocaleTimeString("ar-EG")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="عنوان المقال"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-brand-500"
            dir="auto"
          />

          {/* slug / permalink */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="shrink-0">الرابط:</span>
            <span className="shrink-0 text-slate-400">/{form.language}/articles/</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              placeholder="article-slug"
              dir="ltr"
              className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-left text-sm text-slate-700 outline-none focus:border-brand-400"
            />
          </div>

          <RichEditor
            value={form.body}
            onChange={(html) => set("body", html)}
            dir={form.language === "en" ? "ltr" : "rtl"}
          />
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Publish box */}
          <div className="card p-4">
            <h3 className="mb-3 border-b border-slate-100 pb-2 font-bold text-slate-800">النشر</h3>
            <dl className="space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>الحالة</dt>
                <dd className="font-medium text-slate-800">{statusLabel(form.status)}</dd>
              </div>
              {form.published_at && (
                <div className="flex justify-between">
                  <dt>{isPublished ? "نُشر في" : "موعد النشر"}</dt>
                  <dd className="text-slate-700">
                    {new Date(form.published_at).toLocaleString("ar-EG")}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex flex-col gap-2">
              {articleId && (
                <button onClick={update} disabled={saving} className="btn-primary py-2 text-sm">
                  تحديث
                </button>
              )}
              <button onClick={() => setPreviewOpen(true)} className="btn-outline py-2 text-sm">
                معاينة
              </button>
              {!isPublished && (
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="btn-ghost border border-slate-200 py-2 text-sm"
                >
                  حفظ كمسودة
                </button>
              )}
              {!isPublished && !scheduleOpen ? (
                <button onClick={() => setScheduleOpen(true)} className="btn-outline py-2 text-sm">
                  جدولة
                </button>
              ) : !isPublished && scheduleOpen ? (
                <div className="space-y-2 rounded-lg bg-slate-50 p-2">
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="input py-1.5 text-sm"
                    dir="ltr"
                  />
                  <div className="flex gap-2">
                    <button onClick={schedule} disabled={saving} className="btn-primary flex-1 py-1.5 text-xs">
                      تأكيد الجدولة
                    </button>
                    <button onClick={() => setScheduleOpen(false)} className="btn-ghost px-2 py-1.5 text-xs">
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : null}
              {isPublished ? (
                <button onClick={unpublish} disabled={saving} className="btn-ghost py-2 text-sm text-amber-700">
                  إلغاء النشر
                </button>
              ) : (
                <button
                  onClick={publishNow}
                  disabled={saving}
                  className={`${articleId ? "btn-outline" : "btn-primary"} py-2 text-sm`}
                >
                  نشر الآن
                </button>
              )}
            </div>
          </div>

          {/* Language */}
          <div className="card p-4">
            <h3 className="mb-2 font-bold text-slate-800">{t.language}</h3>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value as Lang)}
              className="input"
            >
              {Object.entries(LANG_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="card p-4">
            <h3 className="mb-2 font-bold text-slate-800">{t.category}</h3>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="input"
            >
              <option value="">— بدون تصنيف —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar || c.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Featured image */}
          <div className="card p-4">
            <h3 className="mb-3 font-bold text-slate-800">الصورة البارزة</h3>
            <FeaturedImage
              value={featured}
              onChange={(v) => {
                setFeatured(v);
                dirty.current = true;
              }}
            />
          </div>

          {/* SEO */}
          <SeoPanel
            form={form}
            onChange={(patch) => {
              setForm((f) => ({ ...f, ...patch }));
              dirty.current = true;
            }}
            bodyHtml={form.body}
          />
        </div>
      </div>

      {previewOpen && (
        <PreviewModal title={form.title} html={form.body} dir={form.language === "en" ? "ltr" : "rtl"} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}

// ── helpers / sub-components ─────────────────────────────────────────────
function statusLabel(s: string): string {
  return { draft: t.st_draft, published: t.st_published, scheduled: t.st_scheduled, archived: t.st_archived }[s] ?? s;
}

/** ISO string → value usable in <input type="datetime-local"> (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PreviewModal({
  title,
  html,
  dir,
  onClose,
}: {
  title: string;
  html: string;
  dir: "rtl" | "ltr";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="mx-auto max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex justify-end">
          <button onClick={onClose} className="btn-primary px-4 py-2 text-sm">إغلاق المعاينة</button>
        </div>
        <article className="card p-8" dir={dir}>
          <h1 className="mb-6 text-3xl font-bold text-slate-900" dir="auto">{title || "—"}</h1>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </div>
  );
}
