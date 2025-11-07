import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";

export const metadata = {
  title: "Trial Dashboard",
  description: "Your AI-powered sales research dashboard is being generated...",
};

/**
 * Layout CORRETO para o Trial Dashboard.
 *
 * Inclui ClerkProvider (necessário para o hook useUser) mas
 * EXCLUI o DashboardProviders para evitar conflitos de
 * autenticação no modo guest.
 */
export default function TrialLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      secretKey={process.env.CLERK_SECRET_KEY}
    >
      <html lang="pt" className="h-full" suppressHydrationWarning>
        <body className="h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}

