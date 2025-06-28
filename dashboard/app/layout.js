import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata = {
  title: "Dashboard Engine MVP",
  description: "Plataforma SaaS para criar dashboards, CRMs, ERPs e CMSs",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="pt" className="h-full" suppressHydrationWarning>
        <body className="h-full bg-gray-50 dark:bg-gray-900 transition-colors">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="dashboard-theme"
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
