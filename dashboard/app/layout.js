import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Dashboard Engine MVP",
  description: "Plataforma SaaS para criar dashboards, CRMs, ERPs e CMSs",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="pt" className="h-full">
        <body className="h-full bg-gray-50 dark:bg-gray-900 transition-colors">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
