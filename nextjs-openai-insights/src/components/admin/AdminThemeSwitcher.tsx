"use client";

import { useAdminTheme } from "@/lib/state/admin-theme-context";

const themes = [
  { id: "ade", label: "Ade Style" },
  { id: "classic", label: "Classic" },
  { id: "dash", label: "Dash Style" },
] as const;

export function AdminThemeSwitcher() {
  const { theme, setTheme } = useAdminTheme();

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs shadow-sm">
      {themes.map((item) => {
        const isActive = theme === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTheme(item.id)}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

