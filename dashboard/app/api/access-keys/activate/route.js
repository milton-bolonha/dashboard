import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AccessKeys } from "@/lib/access-keys";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function handleSuperAdminSetup(key, userId) {
  const setupCollection = db.collection("_internal_setup");
  const setupKeyDoc = await setupCollection.findOne({
    type: "SUPER_ADMIN_SETUP_KEY",
  });

  // Se não houver documento de setup, não é uma chave de super admin
  if (!setupKeyDoc) return null;

  // Verificar se a chave expirou
  if (new Date() > setupKeyDoc.expiresAt) {
    await setupCollection.deleteOne({ _id: setupKeyDoc._id });
    return {
      success: false,
      error: "A chave de configuração de super admin expirou.",
    };
  }

  // Comparar a chave fornecida com o hash
  const isValid = await bcrypt.compare(key, setupKeyDoc.hash);

  if (isValid) {
    // Chave válida! Promover usuário a super admin
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role: "superadmin" },
    });

    // Destruir a chave para que não possa ser usada novamente
    await setupCollection.deleteOne({ _id: setupKeyDoc._id });

    return {
      success: true,
      message:
        "Super Admin ativado! Você agora tem controle total. A página será recarregada.",
      grants: {
        role: "superadmin",
      },
    };
  }

  // Se a chave for do tipo setup mas inválida, retorna nulo para continuar o fluxo normal
  return null;
}

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, workspaceId } = await req.json();
    if (!code || !workspaceId) {
      return NextResponse.json(
        { error: "Código da chave e ID do workspace são obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Tentar processar como chave de setup de Super Admin primeiro
    if (code.startsWith("ds-sa-key")) {
      const setupResult = await handleSuperAdminSetup(code, userId);
      if (setupResult) {
        return NextResponse.json(setupResult);
      }
    }

    // 2. Se não for uma chave de setup, processar como chave de acesso normal
    const accessKeys = new AccessKeys();
    const result = await accessKeys.activateKey(code, userId, workspaceId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na ativação da chave:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro interno." },
      { status: 500 }
    );
  }
}
