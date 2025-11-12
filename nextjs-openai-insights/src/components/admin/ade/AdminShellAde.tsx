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
  return (
    <div
      className="flex h-screen overflow-hidden"
      suppressHydrationWarning
      style={{
        backgroundColor: "transparent", // Deixa o body controlar a cor de fundo
        color: appearance.textColor,
      }}
    >
      <aside
        className="hidden w-64 flex-shrink-0 flex-col p-4 transition-all duration-200 lg:flex lg:overflow-y-auto"
        suppressHydrationWarning
        style={{
          backgroundColor: toRgba("#808080", 0.15), // Semi-transparent gray overlay
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
          suppressHydrationWarning
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
            suppressHydrationWarning
            style={{ color: appearance.textColor }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

