"use client";

import { useEffect } from "react";

import { useAdminTheme } from "@/lib/state/admin-theme-context";

export function AdminThemeSwitcher() {
  const { setTheme } = useAdminTheme();

  useEffect(() => {
    setTheme("ade");
  }, [setTheme]);

  return null;
}
