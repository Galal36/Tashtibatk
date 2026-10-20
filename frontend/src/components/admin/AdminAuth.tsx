"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { adminApi, ApiError, type Me } from "@/lib/admin-api";
import { t } from "@/lib/admin-strings";

const MeContext = createContext<{ me: Me; refresh: () => void } | null>(null);

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe must be used inside <AdminAuth>");
  return ctx;
}

const API = process.env.NEXT_PUBLIC_API_BASE ?? "";

/**
 * Client-side gate for the whole admin area. Resolves the current user via
 * /api/auth/me; renders the login form when unauthenticated or unauthorized.
 * Server routes are independently protected by DRF permissions — this is the
 * UX layer, not the security boundary.
 */
export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminApi
      .get<Me>("/api/auth/me/")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        {t.loading}
      </div>
    );
  }

  if (!me || (me.role !== "admin" && me.role !== "moderator")) {
    return <LoginScreen authorizedButWrongRole={!!me} onLogin={setMe} />;
  }

  return (
    <MeContext.Provider value={{ me, refresh: load }}>{children}</MeContext.Provider>
  );
}

function LoginScreen({
  authorizedButWrongRole,
  onLogin,
}: {
  authorizedButWrongRole: boolean;
  onLogin: (m: Me) => void;
}) {
  const [error, setError] = useState(authorizedButWrongRole ? t.noAccess : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      // prime CSRF cookie then authenticate
      await fetch(`${API}/api/auth/csrf/`, { credentials: "include" });
      const me = await adminApi.post<Me>("/api/auth/login/", {
        email: form.get("email"),
        password: form.get("password"),
      });
      if (me.role !== "admin" && me.role !== "moderator") {
        setError(t.noAccess);
        return;
      }
      onLogin(me);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? t.invalidCreds : t.invalidCreds);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4" dir="rtl">
      <form
        onSubmit={submit}
        className="card w-full max-w-sm space-y-5 p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
            ت
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t.brand}</h1>
        </div>
        <div>
          <label className="label">{t.email}</label>
          <input name="email" type="email" required className="input" autoComplete="username" />
        </div>
        <div>
          <label className="label">{t.password}</label>
          <input
            name="password"
            type="password"
            required
            className="input"
            autoComplete="current-password"
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? t.signingIn : t.signIn}
        </button>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
