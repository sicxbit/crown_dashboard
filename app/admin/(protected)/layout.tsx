import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminShell user={user}>{children}</AdminShell>
  );
}
