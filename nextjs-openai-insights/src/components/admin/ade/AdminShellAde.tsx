"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { toRgba } from "@/lib/color";

interface AdminShellAdeProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  appearance: AdeAppearanceTokens;
}

export function AdminShellAde({
  sidebar,
  header,
  children,
  appearance,
}: AdminShellAdeProps) {
  // Use lazy initialization to avoid setState in effect
  const [mounted, setMounted] = useState(() => false);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // Don't render until mounted and appearance is ready
  if (!mounted || !appearance) {
    return null;
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: "transparent", // Deixa o body controlar a cor de fundo
        color: appearance.textColor,
      }}
    >
      <aside
        className="hidden w-64 flex-shrink-0 flex-col p-4 transition-all duration-200 lg:flex lg:overflow-y-auto"
        style={{
          backgroundColor: appearance.sidebarColor || toRgba("#808080", 0.15), // Use sidebarColor from appearance
          backdropFilter: "blur(10px)",
          color: appearance.textColor,
        }}
      >
        {sidebar}
      </aside>
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: "transparent" }}
      >
        <header
          className="flex flex-shrink-0 items-center px-4"
          style={{
            height: "72px",
            backgroundColor: "transparent",
            color: appearance.headingColor,
          }}
        >
          {header}
        </header>
        <main
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: "transparent" }}
        >
          <div
            className="container mx-auto min-h-full px-6 py-8"
            style={{ color: appearance.textColor }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

