import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // A landing page (/) é pública. Todas as outras rotas
  // são protegidas por padrão.
  publicRoutes: ["/"],

  // Callback para debug
  beforeAuth: (req) => {
    console.log(
      `[MIDDLEWARE DEBUG] Before auth - ${req.method} ${req.nextUrl.pathname}`
    );

    // Log dos headers de autenticação
    const authHeader = req.headers.get("Authorization");
    const cookieHeader = req.headers.get("Cookie");

    console.log(`[MIDDLEWARE DEBUG] Headers:`, {
      hasAuthHeader: !!authHeader,
      authPrefix: authHeader ? authHeader.substring(0, 20) + "..." : "null",
      hasCookies: !!cookieHeader,
      cookieCount: cookieHeader ? cookieHeader.split(";").length : 0,
    });
  },

  afterAuth: (auth, req) => {
    // Log apenas para APIs críticas
    if (req.nextUrl.pathname.includes("/api/access-keys/")) {
      console.log(
        `[MIDDLEWARE] ${req.method} ${req.nextUrl.pathname} - userId: ${
          auth.userId || "undefined"
        }`
      );
    }

    // Se não tiver userId e não for rota pública, redirect
    if (!auth.userId && req.nextUrl.pathname !== "/") {
      return Response.redirect(new URL("/", req.url));
    }
  },
});

export const config = {
  matcher: [
    // Executa o middleware em todas as rotas, exceto as de arquivos estáticos.
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
