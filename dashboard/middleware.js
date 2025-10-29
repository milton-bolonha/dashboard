import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não exigem autenticação
const isPublicRoute = createRouteMatcher([
  "/",
  "/trial(.*)",
  "/admin(.*)", // ⭐ Admin público (guest)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/deploy/webhook",
  "/api/guest(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Se a rota não for pública, protege
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Roda o middleware em todas as rotas, exceto arquivos estáticos e _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Sempre roda nas rotas de API
    "/api/(.*)",
  ],
};
