"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

type Props = {
  redirectTo: string;
  className?: string;
};

export default function LogoutButton({ redirectTo, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const auth = getFirebaseAuth();
        await signOut(auth);
      } catch (error) {
        console.error("Firebase sign out failed", error);
      } finally {
        try {
          await fetch("/api/auth/session", { method: "DELETE" });
        } catch (error) {
          console.error("Failed to clear session", error);
        }
        router.replace(redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className={`rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 ${
        className ?? ""
      }`}
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
