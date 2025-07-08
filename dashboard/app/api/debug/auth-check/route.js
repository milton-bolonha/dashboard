import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import * as ClerkServer from "@clerk/nextjs/server";

// Esta rota tem um único propósito: testar o que o backend consegue ler do Clerk.
// Agora usa getCurrentAuth() como as outras rotas funcionais.
export async function GET() {
  try {
    // Usar getCurrentAuth() como as rotas /api/sections que funcionam
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    console.log("[DEBUG AUTH CHECK] getCurrentAuth() retornou:", authData);

    if (!userId) {
      return NextResponse.json(
        {
          message: "Usuário não autenticado.",
          isLoggedIn: false,
          role: "Nenhum",
        },
        { status: 401 }
      );
    }

    // Usar o clerkClient para buscar o objeto de usuário completo da API do Clerk
    const manualClient = ClerkServer.createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await manualClient.users.getUser(userId);

    const role = user.privateMetadata?.role || "Nenhum";
    const isLoggedIn = !!userId;

    const response = {
      message:
        "Verificação de autenticação usando getCurrentAuth() (mesmo método das rotas funcionais)",
      userId: userId,
      role: role,
      isLoggedIn: isLoggedIn,
      privateMetadata: user.privateMetadata, // Expondo para depuração completa
      authMethod: "getCurrentAuth",
    };

    console.log("[DEBUG AUTH CHECK] Resultado:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DEBUG AUTH CHECK] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao executar a verificação de autenticação.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
