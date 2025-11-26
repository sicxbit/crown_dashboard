import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">Crown Home Care Portal</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Manage agency operations and empower caregivers with real-time visibility into client plans.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          className="rounded-lg bg-brand-600 px-6 py-3 text-white shadow hover:bg-brand-700"
          href="/admin/login"
        >
          Admin Login
        </Link>
        <Link
          className="rounded-lg border border-brand-600 px-6 py-3 text-brand-700 shadow hover:bg-brand-50"
          href="/caregiver/login"
        >
          Caregiver Login
        </Link>
        <Link
          className="rounded-lg border border-slate-300 px-6 py-3 text-slate-700 shadow hover:bg-slate-100"
          href="/tickets"
        >
          Submit a Ticket
        </Link>
        <Link
          className="rounded-lg border border-slate-300 px-6 py-3 text-slate-700 shadow transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          href="/settings"
        >
          Settings
        </Link>
      </div>
    </main>
  );
}
