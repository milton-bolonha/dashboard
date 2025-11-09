"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

type AdminTheme = "classic" | "dash" | "ade";

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
}: AdminThemeProviderProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((nextTheme: AdminTheme) => {
    void nextTheme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    }
  }, []);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme: DEFAULT_THEME,
      setTheme,
      isClassic: false,
      isDash: false,
      isAde: true,
    }),
    [setTheme],
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

