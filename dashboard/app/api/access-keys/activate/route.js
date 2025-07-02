import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { AccessKeys } from "@/lib/access-keys";

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, workspaceId } = await request.json();

    if (!code || !workspaceId) {
      return NextResponse.json(
        { error: "Code and workspaceId are required" },
        { status: 400 }
      );
    }

    // Obter dados do usuário (email)
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Obter IP e User Agent para tracking
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Ativar chave
    const result = await AccessKeys.activateKey(
      code.trim().toUpperCase(),
      userId,
      workspaceId,
      userEmail,
      { ip, userAgent }
    );

    return NextResponse.json({
      success: true,
      message: `Chave "${result.key.name}" ativada com sucesso!`,
      grants: result.grants,
      expiresAt: result.activation.expiresAt,
    });
  } catch (error) {
    console.error("Erro ao ativar chave:", error);

    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
        success: false,
      },
      { status: 400 }
    );
  }
}
