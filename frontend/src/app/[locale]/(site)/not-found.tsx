import Link from "next/link";

/**
 * Rendered inside [locale]/layout (header + footer stay). The locale param is
 * not available to not-found boundaries, so copy is kept neutral/bilingual.
 */
export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <p className="text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        الصفحة غير موجودة · Page not found
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        <br />
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/" className="btn-primary mt-8">
        العودة للرئيسية · Back home
      </Link>
    </div>
  );
}
