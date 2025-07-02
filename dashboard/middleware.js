import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rotas protegidas que requerem autenticação
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/billing(.*)",
  "/api/users(.*)",
  "/api/sections(.*)",
  "/api/content-types(.*)",
  "/api/access(.*)",
  "/api/admin(.*)",
]);

// Rotas que requerem super admin
const isSuperAdminRoute = createRouteMatcher([
  "/dashboard/admin/plans(.*)",
  "/dashboard/admin/features(.*)",
  "/dashboard/admin/access-rules(.*)",
  "/api/admin/(.*)",
]);

// Rotas públicas (não precisam de autenticação)
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks/clerk",
  "/api/webhooks/stripe",
  "/api/public/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Mapeamento de rotas para recursos e ações (para controle de acesso)
const routeAccessMap = {
  "/dashboard/billing": { resource: "billing", action: "view" },
  "/dashboard/users": { resource: "members", action: "view" },
  "/dashboard/settings": { resource: "settings", action: "view" },
  "/dashboard/content-types": { resource: "contentTypes", action: "view" },
  "/api/billing": { resource: "billing", action: "manage" },
  "/api/users/invite": { resource: "members", action: "invite" },
  "/api/workspace/settings": { resource: "settings", action: "edit" },
};

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // Rotas públicas - permitir sempre
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Rotas protegidas - requer autenticação
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Redirecionar para login
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Verificar rotas de super admin
    if (isSuperAdminRoute(req)) {
      const userRole = sessionClaims?.publicMetadata?.role;
      if (userRole !== "superadmin") {
        // Redirecionar para dashboard se não for super admin
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Adicionar headers de controle de acesso para rotas específicas
    const requestHeaders = new Headers(req.headers);

    // Verificar se a rota tem controle de acesso específico
    for (const [route, access] of Object.entries(routeAccessMap)) {
      if (pathname.startsWith(route)) {
        requestHeaders.set("x-access-resource", access.resource);
        requestHeaders.set("x-access-action", access.action);
        requestHeaders.set("x-user-id", userId);

        // Adicionar workspace ID se estiver disponível
        const workspaceId = req.cookies.get("workspace-id")?.value;
        if (workspaceId) {
          requestHeaders.set("x-workspace-id", workspaceId);
        }

        break;
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
