import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

// Esta rota tem um único propósito: testar o que o helper auth()
// do Clerk retorna no ambiente do servidor.
export async function GET() {
  try {
    const { userId, session, claims } = await getAuthenticatedUser();

    const role = claims?.metadata?.role || "Nenhum";
    const isLoggedIn = !!userId;
    const sessionId = session?.id || "Nenhum (undefined/null)";

    const response = {
      message: "Verificação de autenticação do Clerk",
      userId: userId || "Nenhum (undefined/null)",
      sessionId: sessionId,
      role: role,
      isLoggedIn: isLoggedIn,
    };

    console.log("[DEBUG AUTH CHECK] Resultado:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DEBUG AUTH CHECK] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao executar o auth() do Clerk.", details: error.message },
      { status: 500 }
    );
  }
}
