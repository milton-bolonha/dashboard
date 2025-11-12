import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas que não exigem autenticação
const isPublicRoute = createRouteMatcher([
  "/",
  "/trial(.*)",
  "/admin(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/deploy/webhook",
  "/api/health/mongodb",
  "/api/guest(.*)",
  "/api/streams/jobs(.*)",
  "/api/prompt(.*)",
  "/api/prompt-jobs(.*)",
  "/api/themes(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith("/.netlify/")) {
    return;
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.+[\\.][\\w]+$|_next).*)",
    "/api/(.*)",
  ],
};
