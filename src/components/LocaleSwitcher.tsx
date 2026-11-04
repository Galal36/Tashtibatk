"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n/routing";
import { useTranslationContext } from "@/components/TranslationContext";

const LABELS: Record<string, string> = { ar: "العربية", en: "EN", ur: "اردو" };

export function LocaleSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { translations } = useTranslationContext();

  function switchTo(locale: string) {
    // When on an article page and a sibling slug exists for this locale, go there directly.
    if (translations[locale]) {
      router.push(`/${locale}/articles/${translations[locale]}`);
      return;
    }
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            l === current
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
