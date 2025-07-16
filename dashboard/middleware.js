import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não exigem autenticação
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/api/public(.*)", // ← NOVO: Permitir rotas públicas
]);

export default clerkMiddleware(async (auth, req) => {
  // Se a rota não for pública, protege
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Roda o middleware em todas as rotas, exceto a raiz e arquivos estáticos.
    "/((?!^/$|.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
