"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

type ResolvedTheme = "light" | "dark";

type PreferencesContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  displayName: string;
  setTheme: (theme: ThemePreference) => void;
  setDisplayName: (name: string) => void;
};

const STORAGE_KEY = "crown-dashboard-preferences";

const defaultPreferences = (initialDisplayName: string) => ({
  theme: "system" as ThemePreference,
  displayName: initialDisplayName,
});

function readPreferences(initialDisplayName: string) {
  if (typeof window === "undefined") {
    return defaultPreferences(initialDisplayName);
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultPreferences(initialDisplayName);
    }

    const parsed = JSON.parse(stored) as Partial<PreferencesContextValue>;
    const theme =
      parsed.theme === "dark" || parsed.theme === "light" || parsed.theme === "system"
        ? parsed.theme
        : "system";

    return {
      theme,
      displayName: parsed.displayName?.trim() || initialDisplayName,
    } satisfies { theme: ThemePreference; displayName: string };
  } catch (error) {
    console.warn("Unable to read saved preferences", error);
    return defaultPreferences(initialDisplayName);
  }
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  initialDisplayName?: string;
};

export function PreferencesProvider({ children, initialDisplayName = "Active User" }: ProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readPreferences(initialDisplayName).theme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [displayName, setDisplayNameState] = useState<string>(
    () => readPreferences(initialDisplayName).displayName
  );

  useEffect(() => {
    const stored = readPreferences(initialDisplayName);
    setThemeState(stored.theme);
    setDisplayNameState(stored.displayName);
  }, [initialDisplayName]);

  useEffect(() => {
    const getSystemTheme = () => {
      if (typeof window === "undefined") return "light" as ResolvedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const applyTheme = () => {
      const nextTheme = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(nextTheme);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
      }
    };

    applyTheme();

    const mediaQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleChange = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery?.addEventListener("change", handleChange);
    return () => mediaQuery?.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, displayName }));
    }
  }, [theme, displayName]);

  const setTheme = (value: ThemePreference) => setThemeState(value);
  const setDisplayName = (value: string) =>
    setDisplayNameState(value.trim() || defaultPreferences(initialDisplayName).displayName);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      displayName,
      setTheme,
      setDisplayName,
    }),
    [theme, resolvedTheme, displayName]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
