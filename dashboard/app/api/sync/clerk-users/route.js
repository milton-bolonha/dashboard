import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * POST /api/sync/clerk-users
 * Sincroniza usuários do Clerk criando workspaces automaticamente
 */
export async function POST(request) {
  try {
    // Verificar se é admin/owner (opcional, por segurança)
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Iniciando sincronização Clerk → Workspaces");

    // Buscar todos os usuários do Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100,
    });

    console.log(`👥 ${clerkUsers.data.length} usuários encontrados no Clerk`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const clerkUser of clerkUsers.data) {
      try {
        console.log(
          `👤 Processando: ${clerkUser.firstName || "Usuário"} (${
            clerkUser.id
          })`
        );

        // Verificar se já tem workspace
        const existingWorkspace = await db.findOne("workspaces", {
          ownerId: clerkUser.id,
        });

        if (existingWorkspace) {
          console.log(`⚠️ Já tem workspace: ${existingWorkspace.name}`);
          existing++;
          continue;
        }

        // Criar workspace para o usuário
        const workspaceData = {
          name: `Workspace de ${clerkUser.firstName || "Usuário"}`,
          slug: `ws-${clerkUser.id.slice(-8)}-${Date.now()}`,
          ownerId: clerkUser.id,
          description: `Criado automaticamente para ${clerkUser.emailAddresses[0]?.emailAddress}`,
          plan: "free",
          members: [
            {
              userId: clerkUser.id,
              role: "owner",
              permissions: {
                canExport: true,
                canInvite: true,
                canManageBilling: true,
              },
              joinedAt: new Date(),
            },
          ],
          limits: {
            maxUsers: 1,
            maxContentTypes: 3,
            maxSections: 5,
            maxItems: 100,
            maxAPICallsPerMonth: 1000,
          },
          security: {
            apiKeyEnabled: false,
            allowedIPs: [],
          },
          isActive: true,
          createdAt: new Date(),
          lastActivity: new Date(),
        };

        const result = await db.insertOne("workspaces", workspaceData);
        console.log(
          `✅ Workspace criado para ${clerkUser.firstName}: ${result.insertedId}`
        );

        created++;
      } catch (userError) {
        console.error(
          `❌ Erro ao processar usuário ${clerkUser.id}:`,
          userError
        );
        errors++;
      }
    }

    // Relatório
    const report = {
      total: clerkUsers.data.length,
      created,
      existing,
      errors,
    };

    console.log("🎯 Relatório:", report);

    return NextResponse.json({
      success: true,
      message: "Sincronização Clerk → Workspaces concluída",
      report,
    });
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
    return NextResponse.json(
      {
        error: "Falha na sincronização",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/clerk-users
 * Verifica status da sincronização
 */
export async function GET(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Status atual
    const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
    const workspaces = await db.find("workspaces");

    const stats = {
      clerkUsers: clerkUsers.data.length,
      workspaces: workspaces.length,
      needSync: clerkUsers.data.length - workspaces.length,
    };

    return NextResponse.json({
      status: "ok",
      stats,
      recommendation:
        stats.needSync > 0
          ? "Execute POST /api/sync/clerk-users para sincronizar"
          : "Todos os usuários já têm workspaces",
    });
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Falha ao verificar status" },
      { status: 500 }
    );
  }
}
