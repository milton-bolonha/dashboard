import type { Metadata } from "next";

import { Providers } from "@/lib/providers";

import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAI Insights",
  description:
    "Gere insights rápidos com IA, tudo persistido em cookies para um MVP ágil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
