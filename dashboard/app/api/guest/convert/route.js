/**
 * Guest Conversion API
 * POST: Converte guest workspace para usuário real
 *
 * Seguindo padrões do projeto:
 * - getCurrentAuth() para auth
 * - lib/db.js para database
 * - Simple MongoDB updates (sem DeckEngine - não precisa!)
 */

import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

/**
 * POST /api/guest/convert
 * Converte guest workspace em workspace real de usuário autenticado
 */
export async function POST() {
  try {
    // Verificar autenticação (usuário DEVE estar logado)
    const authData = await getCurrentAuth();

    if (!authData.isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign up first." },
        { status: 401 }
      );
    }

    const userId = authData.userId;

    // Buscar guest session
    const guestId = cookies().get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { error: "No guest session to convert" },
        { status: 400 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    console.log(`🔄 Convertendo guest ${guestId} para user ${userId}`);

    // Criar workspace REAL usando MESMA estrutura do onboarding atual
    const workspaceData = {
      name: guestWorkspace.workspace_data.name.replace(" (Trial)", ""),
      description: `Sales research for ${guestWorkspace.workspace_data.onboarding.researchTarget}`,
      ownerId: userId,
      slug: `workspace-${Date.now()}`,
      type: "sales-assistant", // ← Igual onboarding atual

      // Preservar contexto do onboarding
      onboarding: guestWorkspace.workspace_data.onboarding,

      // Sales context para pipeline
      salesContext: {
        pipelineStatus: "pending",
        pipelineJobId: null,
        pipelineStartedAt: null,
      },

      // Tracking de conversão
      convertedFromGuest: true,
      originalGuestId: guestId,
      convertedAt: new Date(),

      created_at: new Date(),
    };

    // Inserir workspace no banco
    const result = await db.insertOne("workspaces", workspaceData);
    const workspaceId = result.insertedId;

    console.log("✅ Workspace criado:", workspaceId.toString());

    // TODO: Migrar companies e tiles do guest para o workspace real
    // Por enquanto, o pipeline vai recriar tudo

    // Marcar guest workspace como convertido
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          converted_to_user_id: userId,
          converted_at: new Date(),
        },
      }
    );

    console.log("✅ Guest workspace marcado como convertido");

    // Atualizar status do workspace (simples - sem DeckEngine)
    await db.updateOne(
      "workspaces",
      { _id: workspaceId },
      {
        $set: {
          "onboarding.completedSteps": [
            "workspace-created",
            "converted-from-guest",
          ],
          "onboarding.currentStep": "completed",
          "salesContext.pipelineStatus": "completed",
          "salesContext.pipelineCompletedAt": new Date(),
        },
      }
    );

    console.log("✅ Workspace status atualizado!");

    // Limpar cookie guest
    cookies().set("guest_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expira imediatamente
      path: "/",
    });

    return NextResponse.json({
      success: true,
      workspace: {
        _id: workspaceId,
        name: workspaceData.name,
        type: workspaceData.type,
      },
      message: "Guest workspace converted successfully!",
    });
  } catch (error) {
    console.error("❌ Erro ao converter guest workspace:", error);

    return NextResponse.json(
      {
        error: "Failed to convert workspace",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
