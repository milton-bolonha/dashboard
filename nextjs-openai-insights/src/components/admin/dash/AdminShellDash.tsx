import type { ReactNode } from "react";

interface AdminShellDashProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export function AdminShellDash({
  sidebar,
  header,
  children,
}: AdminShellDashProps) {
  return (
    <div className="flex min-h-screen bg-[#f7f7f8] text-[#222224]">
      <aside className="hidden w-[250px] border-r border-[#e4e4e7] bg-[#f1f1f2] lg:flex lg:flex-col">
        {sidebar}
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[#e4e4e7] bg-[#f7f7f8]/90 backdrop-blur">
          {header}
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

