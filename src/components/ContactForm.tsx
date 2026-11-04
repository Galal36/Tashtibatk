"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "./Icon";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function ContactForm({
  services,
  defaultService = "",
}: {
  services: { slug: string; name: string }[];
  defaultService?: string;
}) {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`${API_BASE}/api/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.get("full_name"),
          phone: form.get("phone"),
          email: form.get("email"),
          service_interest: form.get("service_interest"),
          message: form.get("message"),
        }),
      });
      setStatus(res.ok ? "ok" : "err");
      if (res.ok) (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white">
          <Check width={28} height={28} />
        </span>
        <p className="text-lg font-semibold text-green-800">{t("success")}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-outline mt-6"
        >
          {t("submit")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="full_name">{t("name")}</label>
        <input id="full_name" name="full_name" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="phone">{t("phone")}</label>
          <input id="phone" name="phone" required className="input" dir="ltr" inputMode="tel" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t("email")}</label>
          <input id="email" name="email" type="email" className="input" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="service_interest">{t("service")}</label>
        <select
          id="service_interest"
          name="service_interest"
          className="input"
          defaultValue={defaultService}
        >
          <option value="" disabled>
            {t("service")}
          </option>
          {services.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="message">{t("message")}</label>
        <textarea id="message" name="message" required rows={5} className="input" />
      </div>
      <button type="submit" disabled={status === "sending"} className="btn-primary btn-lg w-full">
        {status === "sending" ? "…" : t("submit")}
      </button>
      {status === "err" && <p className="text-sm text-red-600">{t("error")}</p>}
    </form>
  );
}
