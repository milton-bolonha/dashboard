import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";
import "@fontsource-variable/inter";

export const metadata = {
  title: "WebApp | AI Research Assistant",
  description:
    "WebApp is your personal research assistant that works even when you sleep",
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
            <AppThemeProvider>
              {children}
            </AppThemeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
