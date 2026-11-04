"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, type DashboardStats } from "@/lib/admin-api";
import { STATUS_LABEL, t } from "@/lib/admin-strings";
import { StatCard, StatusBadge, Spinner } from "@/components/admin/ui";

export default function DashboardHome() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ar";
  const base = `/${locale}/admin`;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get<DashboardStats>("/api/articles/stats/")
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const actions = [
    { href: `${base}/articles/new`, label: t.newArticle, icon: "M12 5v14M5 12h14" },
    { href: `${base}/categories`, label: t.manageCategories, icon: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" },
    { href: `${base}/media`, label: t.mediaLibrary, icon: "M21 5v14H3V5zM8 13l2 3 3-4 4 5H5z" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">{t.dashboard}</h1>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label={t.totalArticles} value={stats?.total} accent="brand" />
            <StatCard label={t.published} value={stats?.published} accent="green" />
            <StatCard label={t.drafts} value={stats?.draft} accent="slate" />
            <StatCard label={t.scheduled} value={stats?.scheduled} accent="amber" />
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.quickActions}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {actions.map((a) => (
                <Link key={a.href} href={a.href} className="card card-hover flex items-center gap-4 p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d={a.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="font-semibold text-slate-800">{a.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.recentlyPublished}
            </h2>
            <div className="card divide-y divide-slate-100">
              {stats && stats.recent.length > 0 ? (
                stats.recent.map((a) => (
                  <Link
                    key={a.id}
                    href={`${base}/articles/${a.id}/edit`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50"
                  >
                    <span className="truncate font-medium text-slate-800">{a.title}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-slate-400">{a.category_name}</span>
                      <StatusBadge status={a.status} label={STATUS_LABEL[a.status]} />
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-400">{t.noArticles}</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
