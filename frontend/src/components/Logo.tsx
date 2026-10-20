/**
 * Tashtibat logotype: a paint-roller mark + the localized wordmark.
 * `name` is passed in so it reads "تشطيبات الكويت" / "Tashtibat" per locale.
 */
export function Logo({
  name,
  variant = "dark",
}: {
  name: string;
  variant?: "dark" | "light";
}) {
  const text = variant === "light" ? "text-white" : "text-slate-900";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="13" height="6" rx="1.5" />
          <path d="M16 6h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7" />
          <path d="M12 11v3" />
          <rect x="9.5" y="14" width="5" height="7" rx="1" />
        </svg>
      </span>
      <span className={`text-lg font-extrabold leading-none ${text}`}>{name}</span>
    </span>
  );
}
