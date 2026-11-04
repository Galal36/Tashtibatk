import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ui";

export const metadata = {
  title: "لوحة التحكم",
  robots: { index: false, follow: false },
};

/**
 * Admin area layout — separate from the public site chrome. Auth gate +
 * dashboard shell + toast host. Forced RTL / Arabic-first via AdminShell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuth>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AdminAuth>
  );
}
