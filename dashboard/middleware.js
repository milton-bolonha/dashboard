import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não exigem autenticação
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/deploy/webhook",
]);

export default clerkMiddleware(async (auth, req) => {
  // Se a rota não for pública, protege
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Roda o middleware em todas as rotas, exceto a raiz, arquivos estáticos E rotas públicas
    "/((?!^/$|.+\\.[\\w]+$|_next|api/public|api/deploy/webhook).*)",
    // Proteger todas as APIs privadas (lista explícita em vez de negative lookahead)
    "/api/access(.*)",
    "/api/admin(.*)",
    "/api/auth(.*)",
    "/api/billing(.*)",
    "/api/content-types(.*)",
    "/api/dashboard(.*)",
    "/api/debug(.*)",
    "/api/deploy(.*)",
    "/api/importer(.*)",
    "/api/migrate(.*)",
    "/api/plans(.*)",
    "/api/sections(.*)",
    "/api/sync(.*)",
    "/api/test-items(.*)",
    "/api/upload(.*)",
    "/api/users(.*)",
    "/api/workspaces(.*)",
    "/(trpc)(.*)",
  ],
};
