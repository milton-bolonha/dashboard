import type { ReactNode } from "react";

interface AdminShellAdeProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  background?: { type: "solid" | "image"; value: string } | null;
}

export function AdminShellAde({
  sidebar,
  header,
  children,
  background,
}: AdminShellAdeProps) {
  const backgroundStyle =
    background?.type === "image"
      ? {
          backgroundImage: `url(${background.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  return (
    <div className="flex h-screen overflow-hidden" style={backgroundStyle}>
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-[#efefef] p-4 transition-all duration-200 lg:flex lg:overflow-y-auto">
        {sidebar}
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden" style={backgroundStyle}>
        <header className="flex flex-shrink-0 items-center border-b border-gray-200" style={{ height: "72px" }}>
          {header}
        </header>
        <main className="flex-1 overflow-y-auto bg-[#fcfcf9]">
          <div className="container mx-auto min-h-full px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

