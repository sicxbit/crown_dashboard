"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type PreferencesContextValue = {
  theme: Theme;
  displayName: string;
  setTheme: (theme: Theme) => void;
  setDisplayName: (name: string) => void;
};

const STORAGE_KEY = "crown-dashboard-preferences";

const defaultPreferences = (initialDisplayName: string) => ({
  theme: "light" as Theme,
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
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      displayName: parsed.displayName?.trim() || initialDisplayName,
    } satisfies { theme: Theme; displayName: string };
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
  const [theme, setThemeState] = useState<Theme>(() => readPreferences(initialDisplayName).theme);
  const [displayName, setDisplayNameState] = useState<string>(
    () => readPreferences(initialDisplayName).displayName
  );

  useEffect(() => {
    const stored = readPreferences(initialDisplayName);
    setThemeState(stored.theme);
    setDisplayNameState(stored.displayName);
  }, [initialDisplayName]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, displayName }));
    }
  }, [theme, displayName]);

  const setTheme = (value: Theme) => setThemeState(value);
  const setDisplayName = (value: string) =>
    setDisplayNameState(value.trim() || defaultPreferences(initialDisplayName).displayName);

  const value = useMemo(
    () => ({
      theme,
      displayName,
      setTheme,
      setDisplayName,
    }),
    [theme, displayName]
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
