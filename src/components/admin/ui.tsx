"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { t } from "@/lib/admin-strings";

// ─── Status badge ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  scheduled: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  accent = "brand",
}: {
  label: string;
  value: number | string | undefined;
  accent?: "brand" | "green" | "amber" | "slate";
}) {
  const ring: Record<string, string> = {
    brand: "text-brand-600",
    green: "text-green-600",
    amber: "text-amber-600",
    slate: "text-slate-700",
  };
  return (
    <div className="card p-5">
      <div className={`text-3xl font-extrabold ${ring[accent]}`}>{value ?? "—"}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
      {label ?? t.loading}
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" dir="rtl">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <p className="text-slate-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost px-4 py-2 text-sm">
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="btn px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toasts ───────────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; kind: "ok" | "err" };
const ToastCtx = createContext<{ push: (msg: string, kind?: "ok" | "err") => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[60] space-y-2" dir="rtl">
        {toasts.map((x) => (
          <div
            key={x.id}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              x.kind === "ok" ? "bg-slate-900" : "bg-red-600"
            }`}
          >
            {x.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
