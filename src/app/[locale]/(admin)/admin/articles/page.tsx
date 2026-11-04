"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  adminApi,
  type AdminArticle,
  type AdminCategory,
  type Paginated,
} from "@/lib/admin-api";
import { LANG_LABEL, STATUS_LABEL, t } from "@/lib/admin-strings";
import { ConfirmDialog, Spinner, StatusBadge, useToast } from "@/components/admin/ui";

const PAGE_SIZE = 20;

export default function ArticleListPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ar";
  const base = `/${locale}/admin`;
  const { push } = useToast();

  const [items, setItems] = useState<AdminArticle[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [langF, setLangF] = useState("");
  const [catF, setCatF] = useState("");
  const [ordering, setOrdering] = useState("-updated_at");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  useEffect(() => {
    adminApi
      .get<Paginated<AdminCategory> | AdminCategory[]>("/api/categories/")
      .then((d) => setCategories(Array.isArray(d) ? d : d.results))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), ordering });
    if (search) qs.set("search", search);
    if (statusF) qs.set("status", statusF);
    if (langF) qs.set("lang", langF);
    if (catF) qs.set("category", catF);
    adminApi
      .get<Paginated<AdminArticle>>(`/api/articles/?${qs}`)
      .then((d) => {
        setItems(d.results);
        setCount(d.count);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }, [page, ordering, search, statusF, langF, catF]);

  // debounce search; immediate for other filters
  useEffect(() => {
    const id = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusF, langF, catF, ordering]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((s) =>
      s.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }

  async function bulk(action: "publish" | "unpublish" | "delete") {
    const run = async () => {
      setConfirm(null);
      try {
        const r = await adminApi.post<{ updated: number }>("/api/articles/bulk/", {
          ids: Array.from(selected),
          action,
        });
        push(`${r.updated} ✓`);
        load();
      } catch {
        push("خطأ", "err");
      }
    };
    if (action === "delete") setConfirm(() => run);
    else run();
  }

  async function deleteOne(a: AdminArticle) {
    setConfirm(() => async () => {
      setConfirm(null);
      try {
        await adminApi.del(`/api/articles/${a.id}/`);
        push("تم الحذف ✓");
        load();
      } catch {
        push("خطأ", "err");
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const allChecked = items.length > 0 && selected.size === items.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.articles}</h1>
        <Link href={`${base}/articles/new`} className="btn-primary px-4 py-2 text-sm">
          + {t.newArticle}
        </Link>
      </div>

      {/* Filters */}
      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchArticles}
          className="input lg:col-span-2"
        />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="input">
          <option value="">{t.allStatuses}</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={langF} onChange={(e) => setLangF(e.target.value)} className="input">
          <option value="">{t.allLanguages}</option>
          {Object.entries(LANG_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={catF} onChange={(e) => setCatF(e.target.value)} className="input">
          <option value="">{t.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name_ar || c.name_en}</option>
          ))}
        </select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm">
          <span className="font-semibold text-brand-700">
            {selected.size} {t.selected}
          </span>
          <div className="flex-1" />
          <button onClick={() => bulk("publish")} className="btn-ghost px-3 py-1.5 text-xs">
            {t.bulkPublish}
          </button>
          <button onClick={() => bulk("unpublish")} className="btn-ghost px-3 py-1.5 text-xs">
            {t.bulkUnpublish}
          </button>
          <button
            onClick={() => bulk("delete")}
            className="btn px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700"
          >
            {t.bulkDelete}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">{t.noArticles}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <SortableTh label={t.title} field="title" ordering={ordering} setOrdering={setOrdering} />
                  <th className="px-4 py-3">{t.category}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3">{t.language}</th>
                  <SortableTh label={t.date} field="updated_at" ordering={ordering} setOrdering={setOrdering} />
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`${base}/articles/${a.id}/edit`}
                        className="font-medium text-slate-800 hover:text-brand-700"
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.category_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} label={STATUS_LABEL[a.status]} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{LANG_LABEL[a.language]}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.updated_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`${base}/articles/${a.id}/edit`}
                          className="text-brand-600 hover:underline"
                        >
                          {t.edit}
                        </Link>
                        <button onClick={() => deleteOne(a)} className="text-red-600 hover:underline">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ›
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ‹
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        message={t.confirmDelete}
        onConfirm={() => confirm?.()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function SortableTh({
  label,
  field,
  ordering,
  setOrdering,
}: {
  label: string;
  field: string;
  ordering: string;
  setOrdering: (o: string) => void;
}) {
  const active = ordering === field || ordering === `-${field}`;
  const desc = ordering === `-${field}`;
  return (
    <th
      className="cursor-pointer select-none px-4 py-3 hover:text-slate-700"
      onClick={() => setOrdering(desc ? field : `-${field}`)}
    >
      {label} {active ? (desc ? "↓" : "↑") : ""}
    </th>
  );
}
