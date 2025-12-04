"use client";

import { FormEvent, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Unable to sign in");
      }

      startTransition(() => {
        router.replace("/admin");
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 transition-colors dark:bg-slate-800 dark:text-slate-100">
          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">Admin Access</span>
          <p className="text-sm text-slate-700 dark:text-slate-100">
            Only agency admin accounts can sign in here. If you are already signed in, use the dashboard navigation to log out before switching accounts.
          </p>
        </div>
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Crown Caregivers" width={160} height={48} className="h-12 w-auto" priority />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Admin Sign In</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Use your agency email and password to access the admin dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
