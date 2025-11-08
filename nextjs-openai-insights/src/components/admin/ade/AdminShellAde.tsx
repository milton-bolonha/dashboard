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
    <div className="flex min-h-screen" style={backgroundStyle}>
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-[#efefef] p-4 lg:flex">
        {sidebar}
      </aside>
      <div className="flex min-h-screen flex-1 flex-col" style={backgroundStyle}>
        <header className="flex-shrink-0 border-b border-gray-200" style={{ height: "72px" }}>
          {header}
        </header>
        <main className="flex-1 overflow-y-auto bg-[#fcfcf9]">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

