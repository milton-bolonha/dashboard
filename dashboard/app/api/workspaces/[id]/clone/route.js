import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth.js";
import { db } from "@/lib/db.js";
import { ObjectId } from "mongodb";
import { cloneWorkspaceComplete } from "@/lib/workspace-clone.js";

export async function POST(request, { params }) {
  try {
    // Aguardar params no Next.js 15
    const { id: workspaceId } = await params;

    console.log("🚀 Iniciando clonagem de workspace:", workspaceId);

    // 1. Autenticação (Regra de Ouro #1)
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    if (!userId) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { newName, newSlug } = await request.json();

    console.log("📋 Dados da clonagem:", {
      workspaceId,
      newName,
      newSlug,
      userId,
    });

    // 2. Validar workspace original
    const originalWorkspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
      ownerId: userId, // Apenas owner pode clonar
    });

    if (!originalWorkspace) {
      console.log("❌ Workspace não encontrado ou acesso negado");
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    console.log("✅ Workspace original encontrado:", originalWorkspace.name);

    // 3. Validar novo nome e slug
    const finalName = newName || `${originalWorkspace.name} (copy)`;
    const finalSlug = newSlug || `${originalWorkspace.slug}-copy-${Date.now()}`;

    // Validar slug único
    const existingWorkspace = await db.findOne("workspaces", {
      slug: finalSlug,
      ownerId: userId,
    });

    if (existingWorkspace) {
      console.log("❌ Slug já existe:", finalSlug);
      return NextResponse.json(
        { error: "Workspace with this slug already exists" },
        { status: 400 }
      );
    }

    // 4. Verificar limites do plano
    const userWorkspaces = await db.find("workspaces", { ownerId: userId });
    const planLimits = originalWorkspace.limits?.maxWorkspaces || 1;

    // 🚨 HACK TEMPORÁRIO: Bypass para usuário de desenvolvimento
    if (userId === "user_30lCRGxlNoUi6cc1l9m30u71zNt") {
      console.log(
        "🔓 HACK DEV: Bypass de limite de workspaces para usuário de desenvolvimento"
      );
    } else if (userWorkspaces.length >= planLimits) {
      console.log(
        "❌ Limite de workspaces atingido:",
        userWorkspaces.length,
        ">=",
        planLimits
      );
      return NextResponse.json(
        { error: "Workspace limit reached for your plan" },
        { status: 403 }
      );
    }

    // 5. Verificar tamanho dos dados a serem clonados
    const contentTypesCount = await db.count("contentTypes", {
      workspaceId: originalWorkspace._id,
    });
    const sectionsCount = await db.count("sections", {
      workspaceId: originalWorkspace._id,
    });
    const itemsCount = await db.count("items", {
      workspaceId: originalWorkspace._id,
    });

    console.log("📊 Estatísticas do workspace:", {
      contentTypes: contentTypesCount,
      sections: sectionsCount,
      items: itemsCount,
    });

    // Estimar tamanho aproximado (em bytes)
    const estimatedSize =
      contentTypesCount * 2048 + sectionsCount * 1024 + itemsCount * 512;
    const storageLimit = originalWorkspace.limits?.storage || 1073741824; // 1GB default

    if (estimatedSize > storageLimit * 0.1) {
      // Máximo 10% do limite
      console.log(
        "❌ Workspace muito grande para clonar:",
        estimatedSize,
        ">",
        storageLimit * 0.1
      );
      return NextResponse.json(
        {
          error:
            "Workspace too large to clone. Consider removing some content first.",
        },
        { status: 413 }
      );
    }

    // 6. Iniciar processo de clonagem
    console.log("🔄 Iniciando processo de clonagem...");
    const cloneResult = await cloneWorkspaceComplete(
      originalWorkspace,
      finalName,
      finalSlug,
      userId
    );

    console.log("✅ Clonagem concluída com sucesso:", cloneResult.stats);

    return NextResponse.json({
      success: true,
      newWorkspace: cloneResult.newWorkspace,
      stats: cloneResult.stats,
      message: "Workspace cloned successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao clonar workspace:", error);
    return NextResponse.json(
      { error: "Failed to clone workspace" },
      { status: 500 }
    );
  }
}
