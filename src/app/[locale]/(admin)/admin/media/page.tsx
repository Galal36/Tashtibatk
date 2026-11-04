"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, type MediaAsset, type Paginated } from "@/lib/admin-api";
import { ConfirmDialog, Spinner, useToast } from "@/components/admin/ui";
import { t } from "@/lib/admin-strings";

function humanSize(bytes: number): string {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { push } = useToast();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<MediaAsset | null>(null);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    adminApi
      .get<Paginated<MediaAsset> | MediaAsset[]>(`/api/media/${qs}`)
      .then((d) => setItems(Array.isArray(d) ? d : d.results))
      .catch(() => push("تعذّر تحميل الوسائط", "err"))
      .finally(() => setLoading(false));
  }, [q, push]);

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append("files", f));
      const res = await adminApi.upload<{ created: MediaAsset[]; errors: { name: string }[] }>(
        "/api/media/",
        fd,
      );
      push(`${res.created.length} ✓${res.errors.length ? ` · ${res.errors.length} ✗` : ""}`);
      load();
    } catch {
      push("فشل الرفع", "err");
    } finally {
      setUploading(false);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => push("تم نسخ الرابط ✓"),
      () => push("تعذّر النسخ", "err"),
    );
  }

  function remove(asset: MediaAsset) {
    setConfirm(() => async () => {
      setConfirm(null);
      try {
        await adminApi.del(`/api/media/${asset.id}/`);
        setActive(null);
        push("تم الحذف ✓");
        load();
      } catch {
        push("خطأ", "err");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t.mediaLibrary}</h1>
        <button onClick={() => fileRef.current?.click()} className="btn-primary px-4 py-2 text-sm">
          + رفع صور
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Dropzone + search */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-4 text-center text-sm transition ${
          dragOver ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-slate-50"
        }`}
      >
        <p className="text-slate-500">
          {uploading ? "جارٍ الرفع…" : "اسحب الصور هنا للرفع، أو استخدم زر الرفع بالأعلى"}
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث بالعنوان…"
        className="input"
      />

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="card py-12 text-center text-sm text-slate-400">لا توجد وسائط بعد.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt_text} className="h-full w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {active && (
        <MediaDrawer
          asset={active}
          onClose={() => setActive(null)}
          onCopy={() => copyUrl(active.url)}
          onDelete={() => remove(active)}
          onSaved={(updated) => {
            setItems((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));
            setActive(updated);
            push("تم الحفظ ✓");
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        message="حذف هذا الملف؟ قد يكون مستخدمًا في مقالات."
        onConfirm={() => confirm?.()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function MediaDrawer({
  asset,
  onClose,
  onCopy,
  onDelete,
  onSaved,
}: {
  asset: MediaAsset;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onSaved: (m: MediaAsset) => void;
}) {
  const [title, setTitle] = useState(asset.title);
  const [alt, setAlt] = useState(asset.alt_text);
  const [caption, setCaption] = useState(asset.caption);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(asset.title);
    setAlt(asset.alt_text);
    setCaption(asset.caption);
  }, [asset]);

  async function save() {
    setSaving(true);
    try {
      const updated = await adminApi.patch<MediaAsset>(`/api/media/${asset.id}/`, {
        title,
        alt_text: alt,
        caption,
      });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">تفاصيل الملف</h3>
          <button onClick={onClose} className="btn-ghost px-3 py-1.5 text-sm">×</button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.alt_text} className="mb-3 w-full rounded-xl border border-slate-200" />

        <dl className="mb-4 grid grid-cols-2 gap-1 text-xs text-slate-500">
          <dt>الأبعاد</dt>
          <dd className="text-slate-700">{asset.width}×{asset.height}</dd>
          <dt>الحجم</dt>
          <dd className="text-slate-700">{humanSize(asset.file_size)}</dd>
          <dt>النوع</dt>
          <dd className="text-slate-700">{asset.mime_type || "—"}</dd>
        </dl>

        <div className="mb-4 flex gap-2">
          <input readOnly value={asset.url} className="input flex-1 text-left text-xs" dir="ltr" />
          <button onClick={onCopy} className="btn-outline px-3 py-2 text-xs">نسخ</button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">العنوان</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">نص بديل (Alt)</span>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} className="input py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">تعليق</span>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} className="input py-2 text-sm" />
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2 text-sm">
            {saving ? "…" : "حفظ"}
          </button>
          <button onClick={onDelete} className="btn px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700">
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
