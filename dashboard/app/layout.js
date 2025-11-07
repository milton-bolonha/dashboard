import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const metadata = {
  title: "Dashboard Engine MVP",
  description: "SaaS Platform para criar dashboards, CRMs, ERPs e CMSs",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      secretKey={process.env.CLERK_SECRET_KEY}
    >
      <html lang="pt" className="h-full" suppressHydrationWarning>
        <body className="h-full">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
