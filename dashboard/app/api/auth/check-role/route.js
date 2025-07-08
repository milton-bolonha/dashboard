import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import * as ClerkServer from "@clerk/nextjs/server";

/**
 * GET /api/auth/check-role
 * Verifica de forma segura a role do usuário atual
 * Necessário porque privateMetadata não é acessível no frontend
 */
export async function GET() {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", isSuperAdmin: false },
        { status: 401 }
      );
    }

    // Buscar usuário completo do Clerk para acessar privateMetadata
    const manualClient = ClerkServer.createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await manualClient.users.getUser(userId);
    const role = user.privateMetadata?.role;
    const isSuperAdmin = role === "superadmin";

    return NextResponse.json({
      userId,
      role,
      isSuperAdmin,
    });
  } catch (error) {
    console.error("Erro ao verificar role:", error);
    return NextResponse.json(
      { error: "Internal error", isSuperAdmin: false },
      { status: 500 }
    );
  }
}
