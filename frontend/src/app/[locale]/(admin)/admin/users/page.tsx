"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminApi,
  ApiError,
  type AdminUser,
  type Paginated,
  type Role,
} from "@/lib/admin-api";
import { useMe } from "@/components/admin/AdminAuth";
import { ConfirmDialog, Spinner, useToast } from "@/components/admin/ui";
import { t } from "@/lib/admin-strings";

const ROLE_LABEL: Record<Role, string> = { admin: "مدير", moderator: "محرّر" };

export default function UsersPage() {
  const { push } = useToast();
  const { me } = useMe();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Paginated<AdminUser> | AdminUser[]>("/api/users/")
      .then((d) => setItems(Array.isArray(d) ? d : d.results))
      .catch(() => push("تعذّر التحميل", "err"))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(() => load(), [load]);

  function remove(u: AdminUser) {
    if (u.id === me.id) {
      push("لا يمكنك حذف حسابك", "err");
      return;
    }
    setConfirm(() => async () => {
      setConfirm(null);
      try {
        await adminApi.del(`/api/users/${u.id}/`);
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
        <h1 className="text-2xl font-bold text-slate-900">{t.users}</h1>
        <button onClick={() => setEditing("new")} className="btn-primary px-4 py-2 text-sm">
          + مستخدم جديد
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">لا يوجد مستخدمون.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">{t.email}</th>
                  <th className="px-4 py-3">الدور</th>
                  <th className="px-4 py-3">مفعّل</th>
                  <th className="px-4 py-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-500" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.is_active ? "نعم" : "لا"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(u)} className="text-brand-600 hover:underline">
                          {t.edit}
                        </button>
                        <button onClick={() => remove(u)} className="text-red-600 hover:underline">
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
        <UserModal
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        message="حذف هذا المستخدم؟"
        onConfirm={() => confirm?.()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "moderator");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!email.trim()) {
      push("البريد مطلوب", "err");
      return;
    }
    if (!user && password.length < 8) {
      push("كلمة المرور 8 أحرف على الأقل", "err");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        email,
        full_name: fullName,
        role,
        is_active: isActive,
      };
      if (password) body.password = password;
      if (user) await adminApi.patch(`/api/users/${user.id}/`, body);
      else await adminApi.post("/api/users/", body);
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
        <h3 className="border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
          {user ? "تعديل المستخدم" : "مستخدم جديد"}
        </h3>

        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">الاسم الكامل</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input py-2 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">{t.email}</span>
          <input value={email} dir="ltr" onChange={(e) => setEmail(e.target.value)} className="input py-2 text-left text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">
            {t.password} {user && <span className="text-slate-400">(اتركها فارغة للإبقاء عليها)</span>}
          </span>
          <input
            type="password"
            value={password}
            dir="ltr"
            onChange={(e) => setPassword(e.target.value)}
            className="input py-2 text-left text-sm"
            placeholder="••••••••"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">الدور</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input py-2 text-sm">
            <option value="moderator">محرّر</option>
            <option value="admin">مدير</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
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
  );
}
