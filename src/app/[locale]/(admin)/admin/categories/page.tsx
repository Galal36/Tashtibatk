"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminApi,
  ApiError,
  type AdminCategory,
  type Paginated,
} from "@/lib/admin-api";
import { ConfirmDialog, Spinner, useToast } from "@/components/admin/ui";
import { t } from "@/lib/admin-strings";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const { push } = useToast();
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Paginated<AdminCategory> | AdminCategory[]>("/api/categories/")
      .then((d) => setItems(Array.isArray(d) ? d : d.results))
      .catch(() => push("تعذّر التحميل", "err"))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(() => load(), [load]);

  async function toggleActive(c: AdminCategory) {
    try {
      await adminApi.patch(`/api/categories/${c.id}/`, { is_active: !c.is_active });
      setItems((arr) => arr.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
    } catch {
      push("خطأ", "err");
    }
  }

  function remove(c: AdminCategory) {
    if (c.article_count > 0) {
      push("لا يمكن حذف تصنيف يحتوي على مقالات", "err");
      return;
    }
    setConfirm(() => async () => {
      setConfirm(null);
      try {
        await adminApi.del(`/api/categories/${c.id}/`);
        push("تم الحذف ✓");
        load();
      } catch {
        push("خطأ", "err");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.categories}</h1>
        <button onClick={() => setEditing("new")} className="btn-primary px-4 py-2 text-sm">
          + تصنيف جديد
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">لا توجد تصنيفات.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">الاسم (عربي)</th>
                  <th className="px-4 py-3">الاسم (إنجليزي)</th>
                  <th className="px-4 py-3">المقالات</th>
                  <th className="px-4 py-3">مفعّل</th>
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name_ar || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{c.name_en || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{c.article_count}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.is_active ? "نعم" : "لا"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(c)} className="text-brand-600 hover:underline">
                          {t.edit}
                        </button>
                        <button onClick={() => remove(c)} className="text-red-600 hover:underline">
                          {t.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <CategoryModal
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        message="حذف هذا التصنيف؟"
        onConfirm={() => confirm?.()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

interface CatForm {
  name_ar: string;
  name_en: string;
  name_ur: string;
  slug: string;
  description_ar: string;
  description_en: string;
  description_ur: string;
  icon: string;
  meta_title: string;
  meta_description: string;
  display_order: number;
  is_active: boolean;
}

function CategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: AdminCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [f, setF] = useState<CatForm>({
    name_ar: category?.name_ar ?? "",
    name_en: category?.name_en ?? "",
    name_ur: category?.name_ur ?? "",
    slug: category?.slug ?? "",
    description_ar: category?.description_ar ?? "",
    description_en: category?.description_en ?? "",
    description_ur: category?.description_ur ?? "",
    icon: category?.icon ?? "",
    meta_title: category?.meta_title ?? "",
    meta_description: category?.meta_description ?? "",
    display_order: category?.display_order ?? 0,
    is_active: category?.is_active ?? true,
  });
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const slugTouched = useRef(Boolean(category));

  function set<K extends keyof CatForm>(k: K, v: CatForm[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  // auto-slug from English name (latin) until edited
  useEffect(() => {
    if (slugTouched.current) return;
    const s = slugify(f.name_en);
    if (s) setF((p) => ({ ...p, slug: s }));
  }, [f.name_en]);

  async function save() {
    if (!f.name_ar && !f.name_en) {
      push("الاسم مطلوب", "err");
      return;
    }
    const slug = f.slug || slugify(f.name_en) || `cat-${Date.now().toString(36)}`;
    setSaving(true);
    try {
      const path = category ? `/api/categories/${category.id}/` : "/api/categories/";
      if (image) {
        const fd = new FormData();
        Object.entries({ ...f, slug }).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("image", image);
        if (category) await adminApi.patchForm(path, fd);
        else await adminApi.upload(path, fd);
      } else {
        const body = { ...f, slug };
        if (category) await adminApi.patch(path, body);
        else await adminApi.post(path, body);
      }
      push("تم الحفظ ✓");
      onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.data && typeof e.data === "object"
          ? Object.values(e.data as Record<string, unknown>).flat().join(" · ")
          : "تعذّر الحفظ";
      push(String(msg), "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="mx-auto my-4 max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card space-y-4 p-6" dir="rtl">
          <h3 className="border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
            {category ? "تعديل التصنيف" : "تصنيف جديد"}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="الاسم (عربي)" value={f.name_ar} onChange={(v) => set("name_ar", v)} dir="rtl" />
            <Field label="الاسم (إنجليزي)" value={f.name_en} onChange={(v) => set("name_en", v)} dir="ltr" />
            <Field label="الاسم (أردو)" value={f.name_ur} onChange={(v) => set("name_ur", v)} dir="rtl" />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">الرابط (Slug)</span>
            <input
              value={f.slug}
              dir="ltr"
              onChange={(e) => {
                slugTouched.current = true;
                set("slug", slugify(e.target.value));
              }}
              className="input py-2 text-left text-sm"
              placeholder="category-slug"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextArea label="وصف (عربي)" value={f.description_ar} onChange={(v) => set("description_ar", v)} />
            <TextArea label="وصف (إنجليزي)" value={f.description_en} onChange={(v) => set("description_en", v)} />
            <TextArea label="وصف (أردو)" value={f.description_ur} onChange={(v) => set("description_ur", v)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="أيقونة (اسم/رمز)" value={f.icon} onChange={(v) => set("icon", v)} dir="ltr" />
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">ترتيب العرض</span>
              <input
                type="number"
                value={f.display_order}
                onChange={(e) => set("display_order", Number(e.target.value))}
                className="input py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">صورة التصنيف</span>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="text-sm" />
            {category?.image_url && !image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image_url} alt="" className="mt-2 h-20 rounded-lg object-cover" />
            )}
          </label>

          <details>
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">SEO</summary>
            <div className="mt-3 space-y-3">
              <Field label="عنوان Meta" value={f.meta_title} onChange={(v) => set("meta_title", v)} dir="rtl" />
              <TextArea label="وصف Meta" value={f.meta_description} onChange={(v) => set("meta_description", v)} />
            </div>
          </details>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            مفعّل
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">{t.cancel}</button>
            <button onClick={save} disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving ? "…" : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir: "rtl" | "ltr";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input value={value} dir={dir} onChange={(e) => onChange(e.target.value)} className="input py-2 text-sm" />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <textarea value={value} rows={2} onChange={(e) => onChange(e.target.value)} className="input py-2 text-sm" />
    </label>
  );
}
