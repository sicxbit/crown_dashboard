"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePreferences } from "@/components/common/PreferencesProvider";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemeOption = (typeof themeOptions)[number]["value"];

export default function SettingsPage() {
  const { theme, setTheme, displayName, setDisplayName } = usePreferences();
  const [nameDraft, setNameDraft] = useState(displayName);

  useEffect(() => {
    setNameDraft(displayName);
  }, [displayName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setDisplayName(nameDraft);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Personalize your experience by updating the theme and active display name.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Back home
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Theme</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Switch between light and dark appearances. Your choice is saved in your browser.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {themeOptions.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value as ThemeOption)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white shadow"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Active user name</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Choose the name shown across navigation and dashboards.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Enter your preferred name"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            Save display name
          </button>
        </form>
      </section>
    </main>
  );
}
