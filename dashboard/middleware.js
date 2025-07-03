import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Lista de rotas que não exigem autenticação
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Lista de rotas que exigem a role de 'superadmin'
const isSuperAdminRoute = createRouteMatcher([
  "/dashboard/admin/(.*)",
  "/api/admin/(.*)",
]);

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();

  // Se a rota é pública, permite o acesso sem verificar o login.
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Se a rota NÃO é pública, ela requer um usuário logado.
  // Se não há userId, redireciona para a página de login.
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Se o usuário está logado, verificamos se a rota exige superadmin.
  if (isSuperAdminRoute(req)) {
    // Se a rota é de superadmin mas o usuário não tem a role, redireciona.
    if (sessionClaims?.publicMetadata?.role !== "superadmin") {
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Se o usuário está logado e passou por todas as verificações, permite o acesso.
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Executar o middleware em todas as rotas, exceto as de arquivos estáticos.
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
