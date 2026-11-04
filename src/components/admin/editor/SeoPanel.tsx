"use client";

import { useMemo, useState } from "react";

export interface SeoFields {
  title: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  og_title: string;
  og_description: string;
}

function plainText(html: string): string {
  if (typeof document === "undefined") return html;
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? "";
}

interface Check {
  ok: boolean;
  label: string;
}

function scoreOf(f: SeoFields, bodyText: string): { checks: Check[]; pct: number } {
  const kw = f.focus_keyword.trim().toLowerCase();
  const metaTitle = (f.meta_title || f.title).toLowerCase();
  const firstChunk = bodyText.slice(0, 200).toLowerCase();
  const checks: Check[] = [
    { ok: Boolean(kw), label: "تم تحديد كلمة مفتاحية" },
    { ok: Boolean(kw) && metaTitle.includes(kw), label: "الكلمة المفتاحية في العنوان" },
    { ok: Boolean(kw) && f.slug.toLowerCase().includes(kw.replace(/\s+/g, "-")), label: "الكلمة المفتاحية في الرابط" },
    { ok: Boolean(kw) && f.meta_description.toLowerCase().includes(kw), label: "الكلمة المفتاحية في الوصف" },
    { ok: Boolean(kw) && firstChunk.includes(kw), label: "الكلمة المفتاحية في بداية المقال" },
    { ok: f.meta_description.length >= 50 && f.meta_description.length <= 160, label: "طول الوصف بين 50 و160 حرفًا" },
    { ok: (f.meta_title || f.title).length > 0 && (f.meta_title || f.title).length <= 60, label: "عنوان SEO بطول مناسب" },
  ];
  const passed = checks.filter((c) => c.ok).length;
  return { checks, pct: Math.round((passed / checks.length) * 100) };
}

function Meter({ value, max }: { value: number; max: number }) {
  const over = value > max;
  return (
    <span className={`text-xs ${over ? "text-red-600" : value > max * 0.6 ? "text-amber-600" : "text-slate-400"}`}>
      {value}/{max}
    </span>
  );
}

export function SeoPanel({
  form,
  onChange,
  bodyHtml,
}: {
  form: SeoFields;
  onChange: (patch: Partial<SeoFields>) => void;
  bodyHtml: string;
}) {
  const [open, setOpen] = useState(false);
  const bodyText = useMemo(() => plainText(bodyHtml), [bodyHtml]);
  const { checks, pct } = useMemo(() => scoreOf(form, bodyText), [form, bodyText]);
  const badge = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between font-bold text-slate-800"
      >
        <span>تحسين محركات البحث (SEO)</span>
        <span className={`rounded-full px-2 py-0.5 text-xs text-white ${badge}`}>{pct}%</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">الكلمة المفتاحية</span>
            <input
              value={form.focus_keyword}
              onChange={(e) => onChange({ focus_keyword: e.target.value })}
              className="input py-2 text-sm"
              placeholder="مثال: تشطيبات الشقق"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs text-slate-500">
              عنوان SEO <Meter value={(form.meta_title || form.title).length} max={60} />
            </span>
            <input
              value={form.meta_title}
              onChange={(e) => onChange({ meta_title: e.target.value })}
              className="input py-2 text-sm"
              placeholder={form.title || "عنوان الصفحة في نتائج البحث"}
            />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-xs text-slate-500">
              وصف Meta <Meter value={form.meta_description.length} max={160} />
            </span>
            <textarea
              value={form.meta_description}
              onChange={(e) => onChange({ meta_description: e.target.value })}
              rows={3}
              className="input py-2 text-sm"
              placeholder="وصف مختصر يظهر في نتائج البحث"
            />
          </label>

          {/* Google-style preview */}
          <div className="rounded-lg border border-slate-200 p-3" dir="rtl">
            <p className="truncate text-sm text-blue-800">{form.meta_title || form.title || "عنوان المقال"}</p>
            <p className="truncate text-xs text-emerald-700">…/articles/{form.slug || "slug"}</p>
            <p className="line-clamp-2 text-xs text-slate-500">
              {form.meta_description || plainText(bodyHtml).slice(0, 160) || "وصف المقال…"}
            </p>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">مشاركة على وسائل التواصل (Open Graph)</summary>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">عنوان OG</span>
                <input
                  value={form.og_title}
                  onChange={(e) => onChange({ og_title: e.target.value })}
                  className="input py-2 text-sm"
                  placeholder={form.meta_title || form.title}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">وصف OG</span>
                <textarea
                  value={form.og_description}
                  onChange={(e) => onChange({ og_description: e.target.value })}
                  rows={2}
                  className="input py-2 text-sm"
                  placeholder={form.meta_description}
                />
              </label>
            </div>
          </details>

          {/* Checklist */}
          <ul className="space-y-1.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-xs">
                <span className={c.ok ? "text-emerald-600" : "text-slate-300"}>{c.ok ? "●" : "○"}</span>
                <span className={c.ok ? "text-slate-700" : "text-slate-400"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
