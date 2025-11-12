import { Suspense } from "react";
import Script from "next/script";

import { AdminContainer } from "@/containers/admin/AdminContainer";
import { AdminThemeProvider } from "@/lib/state/admin-theme-context";

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm">
        Carregando workspace...
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Script
        id="apply-base-color"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const stored = localStorage.getItem('ade-base-color');
                if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
                  // Apply immediately to prevent flash of default color
                  const root = document.documentElement;
                  root.style.setProperty('--ade-base-color', stored);
                  // Apply to body immediately if available
                  if (document.body) {
                    document.body.style.backgroundColor = stored;
                  } else {
                    // Wait for body to be available
                    document.addEventListener('DOMContentLoaded', function() {
                      if (document.body) {
                        document.body.style.backgroundColor = stored;
                      }
                    });
                  }
                }
              } catch (e) {
                // ignore
              }
            })();
          `,
        }}
      />
      <AdminThemeProvider>
        <Suspense fallback={<AdminFallback />}>
          <AdminContainer />
        </Suspense>
      </AdminThemeProvider>
    </>
  );
}

