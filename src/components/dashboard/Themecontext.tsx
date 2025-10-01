import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "auto";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "auto"
  );

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (t: Theme) => {
      if (t === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", t === "dark");
      }
    };

    applyTheme(theme);
    localStorage.setItem("theme", theme);

    // If system theme changes while in auto mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (theme === "auto") {
        root.classList.toggle("dark", e.matches);
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () =>
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
