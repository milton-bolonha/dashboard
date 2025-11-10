"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AdminTheme = "classic" | "dash" | "ade";

interface AdminThemeContextValue {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  isClassic: boolean;
  isDash: boolean;
  isAde: boolean;
}

const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "admin-theme";
const DEFAULT_THEME: AdminTheme = "ade";

interface AdminThemeProviderProps {
  children: ReactNode;
  initialTheme?: AdminTheme;
}

export function AdminThemeProvider({
  children,
  initialTheme,
}: AdminThemeProviderProps) {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (
        stored === "classic" ||
        stored === "dash" ||
        stored === "ade"
      ) {
        return stored;
      }
    }
    return initialTheme ?? DEFAULT_THEME;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme: AdminTheme) => {
    setThemeState((current) => {
      if (current === nextTheme) {
        return current;
      }
      return nextTheme;
    });
  }, []);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme,
      setTheme,
      isClassic: theme === "classic",
      isDash: theme === "dash",
      isAde: theme === "ade",
    }),
    [setTheme, theme],
  );

  return (
    <AdminThemeContext.Provider value={value}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const value = useContext(AdminThemeContext);
  if (!value) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return value;
}

