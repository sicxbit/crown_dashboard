"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebaseClient";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function CaregiverLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  const sendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error("reCAPTCHA not ready. Please reload the page.");
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirmationResult) {
      setError("Please request a verification code first.");
      return;
    }

    setError(null);
    try {
      const credential = await confirmationResult.confirm(otp);
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
        router.replace("/caregiver/dashboard");
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="Crown Caregivers" width={160} height={48} className="h-12 w-auto" priority />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Caregiver Portal Login</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter your mobile number to receive a one-time passcode.
        </p>
        {step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="phone">
                Mobile Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+1 555-555-1234"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              Send Code
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="otp">
                One-Time Passcode
              </label>
              <input
                id="otp"
                type="text"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                maxLength={6}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {isPending ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}
        <div id="recaptcha-container" />
      </div>
    </main>
  );
}
