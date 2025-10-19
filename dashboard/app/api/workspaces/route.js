import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkspaceSchema, validateSchema } from "@/schemas/index.js";
import { validateWorkspaceName } from "@/lib/workspace-validation";

/**
 * GET /api/workspaces
 * Lista todos os workspaces do usuário atual
 */
export async function GET(request) {
  try {
    // Validar autenticação
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    if (!userId || userId === "temp_user_dev") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Buscando workspaces para usuário:", userId);

    // Buscar workspaces onde o usuário é membro
    const workspaces = await db.find("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
      isActive: true,
    });

    console.log("✅ Workspaces encontrados:", workspaces.length);

    return NextResponse.json({
      workspaces,
      count: workspaces.length,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar workspaces:", error);
    return NextResponse.json(
      { error: "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces
 * Cria um novo workspace
 */
export async function POST(request) {
  try {
    // Validar autenticação
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    if (!userId || userId === "temp_user_dev") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    console.log("🚀 Criando workspace:", data);

    // ⭐ NOVO: Validar nome duplicado ANTES de gerar slug
    const nameValidation = await validateWorkspaceName(data.name, userId);
    if (!nameValidation.valid) {
      console.error("❌ Nome duplicado:", data.name);
      return NextResponse.json(
        {
          error: nameValidation.error,
          suggestion: nameValidation.suggestion,
          existingId: nameValidation.existingId,
        },
        { status: 400 }
      );
    }

    // Gerar slug único para o usuário
    const baseSlug = data.slug || generateSlug(data.name);
    const uniqueSlug = await generateUniqueSlug(baseSlug, userId);

    // ⭐ NOVO: Processar contexto de onboarding se fornecido
    const hasOnboardingContext =
      data.metadata?.solution && data.metadata?.researchTarget;
    const workspaceType = hasOnboardingContext ? "sales-assistant" : "cms";

    // Preparar dados do workspace
    const workspaceData = {
      ...data,
      ownerId: userId,
      slug: uniqueSlug,
      type: workspaceType,
      isActive: true,
      members: [
        {
          userId: userId,
          role: "owner",
          permissions: {
            canExport: true,
            canInvite: true,
            canManageBilling: true,
          },
          joinedAt: new Date(),
        },
      ],

      // ⭐ NOVO: Inicializar onboarding se fornecido
      ...(hasOnboardingContext && {
        onboarding: {
          salesRepAt: data.name,
          sellingSolutionsFor: data.metadata.solution,
          researchTarget: data.metadata.researchTarget,
          source:
            data.metadata.createdVia === "landing-onboarding"
              ? "landing"
              : "dashboard",
          completedSteps: ["workspace-created"],
          currentStep: "setup-dashboard",
          capturedAt: new Date(),
        },
        salesContext: {
          solution: data.metadata.solution,
          pipelineStatus: "pending",
        },
        credits: {
          plan: "free",
          quota: 1000,
          consumed: 0,
          resetsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      }),

      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Validar schema
    const validation = validateSchema(workspaceData, WorkspaceSchema);
    if (!validation.isValid) {
      console.error("❌ Validação falhou:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Criar workspace
    const result = await db.insertOne("workspaces", workspaceData);
    console.log("✅ Workspace criado:", result.insertedId);

    // Buscar workspace criado
    const newWorkspace = await db.findOne("workspaces", {
      _id: result.insertedId,
    });

    // ⭐ NOVO: Disparar pipeline de onboarding se for Sales Assistant
    let pipelineInfo = null;
    if (hasOnboardingContext) {
      try {
        const { executeOnboardingPipeline } = await import(
          "@/lib/onboarding-pipeline"
        );

        const matchId = await executeOnboardingPipeline(
          result.insertedId.toString(),
          {
            company: data.name,
            solution: data.metadata.solution,
            research: data.metadata.researchTarget,
          },
          userId
        );

        pipelineInfo = { started: true, matchId };
        console.log("✅ Onboarding pipeline iniciado:", matchId);
      } catch (pipelineError) {
        console.error("⚠️ Erro ao iniciar pipeline:", pipelineError);
        // Não falhar a criação do workspace por causa do pipeline
        pipelineInfo = { started: false, error: pipelineError.message };
      }
    }

    return NextResponse.json({
      workspace: newWorkspace,
      message: "Workspace criado com sucesso",
      ...(pipelineInfo && { pipeline: pipelineInfo }),
    });
  } catch (error) {
    console.error("❌ Erro ao criar workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

/**
 * Gera slug único baseado no nome
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Gera slug único para o usuário específico
 */
async function generateUniqueSlug(baseSlug, userId) {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    // Verificar se slug existe apenas nos workspaces do usuário
    const existingWorkspace = await db.findOne("workspaces", {
      slug: slug,
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!existingWorkspace) {
      return slug;
    }

    // Se existe, tentar com sufixo numérico
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
