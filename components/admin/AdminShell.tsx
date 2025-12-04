"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/common/LogoutButton";
import ActiveUserSummary from "@/components/common/ActiveUserSummary";

const NAV_ITEMS: Array<{ key: string; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "assignments", label: "Assignments", href: "/admin/assignments" },
  { key: "tickets", label: "Tickets", href: "/admin/tickets" },
];

type Props = {
  user: CurrentUser;
  children: React.ReactNode;
};

function getActiveKey(pathname: string) {
  const [, maybeAdmin, section] = pathname.split("/");
  if (maybeAdmin !== "admin") return "";
  return section || "dashboard";
}

export default function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const active = getActiveKey(pathname);

  return (
    <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <Link href="/admin" className="flex items-center gap-3" aria-label="Admin home">
              <Image
                src="/logo.png"
                width={160}
                height={40}
                alt="Crown Caregivers"
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label="Admin navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`rounded-md px-3 py-2 transition ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                        : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-4">
            <ActiveUserSummary
              fallbackName={user.email ?? "Admin"}
              secondaryLine={user.email ? `Email: ${user.email}` : undefined}
              roleLabel={`Signed in as ${user.role}`}
            />
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/settings"
                className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Settings
              </Link>
              <LogoutButton redirectTo="/admin/login" />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
