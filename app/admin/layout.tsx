import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminContentTransition from "@/components/admin/AdminContentTransition";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("next-url") ?? "";

  if (pathname.startsWith("/admin/login")) {
    return children;
  }

  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminShell user={user}>
      <AdminContentTransition>{children}</AdminContentTransition>
    </AdminShell>
  );
}
