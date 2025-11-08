import type { ReactNode } from "react";

interface AdminShellClassicProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function AdminShellClassic({
  sidebar,
  header,
  children,
}: AdminShellClassicProps) {
  return (
    <div className="flex min-h-screen bg-[#f7f7f7] text-slate-900">
      <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:w-72 lg:flex-col">
        {sidebar}
      </aside>
      <div className="flex min-h-screen flex-1 flex-col bg-[#fcfcf9]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          {header}
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

