import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth";
import {
  validateSlug,
  generateSlug,
  isSlugUnique,
} from "@/lib/slug-validation.js";

/**
 * Helper para obter workspace do usuário (cria se não existir)
 */
async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      try {
        // ✅ CORREÇÃO: Converter string para ObjectId
        const workspaceObjectId = new ObjectId(requestedWorkspaceId);

        workspace = await db.findOne("workspaces", {
          _id: workspaceObjectId, // ← FIX: Usar ObjectId ao invés de string
          $or: [{ ownerId: userId }, { "members.userId": userId }],
        });

        if (workspace) {
          console.log(
            `🎯 Content-types: Usando workspace específico: ${workspace.name} (${workspace._id})`
          );
          return workspace;
        } else {
          console.log(
            `⚠️ Content-types: Workspace ${requestedWorkspaceId} não encontrado ou sem permissão`
          );
        }
      } catch (error) {
        console.log(
          `❌ Content-types: Erro ao converter workspaceId para ObjectId: ${requestedWorkspaceId}`,
          error
        );
      }
    }

    // Fallback: buscar qualquer workspace do usuário
    workspace = await db.findOne("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      console.log(
        `🔧 Content-types: Criando workspace automático para usuário: ${userId}`
      );

      // Criar workspace automático
      const result = await db.insertOne("workspaces", {
        name: "Meu Workspace",
        slug: `ws-${userId.slice(-8)}-${Date.now()}`,
        ownerId: userId,
        plan: "free",
        members: [{ userId, role: "owner", permissions: { canExport: true } }],
        limits: {
          maxUsers: 1,
          maxContentTypes: 3,
          maxSections: 5,
          maxItems: 100,
        },
        isActive: true,
        createdAt: new Date(),
      });

      workspace = await db.findOne("workspaces", { _id: result.insertedId });
    }

    console.log(
      `🏢 Content-types: Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Content-types: Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/content-types
 * Lista todos os content types do usuário e workspace
 */
export async function GET(request) {
  const authData = await getCurrentAuth();
  const userId = authData.userId || "temp_user_dev";

  // Obter workspace ID do header (enviado pelo frontend)
  const workspaceId = request.headers.get("x-workspace-id");

  console.log("🔐 Content-types GET: userId =", userId);
  console.log("🏢 Content-types: Workspace solicitado:", workspaceId);

  try {
    // Obter workspace atual (específico ou fallback)
    const workspace = await getCurrentWorkspace(userId, workspaceId);
    console.log(
      `🏢 Content-types: Workspace encontrado: ${workspace.name} (${workspace._id})`
    );

    const contentTypes = await db.find("contentTypes", {
      userId: userId,
      workspaceId: workspace._id, // ← WORKSPACE: filtrar por workspace
    });

    console.log(
      `✅ Content-types: Encontrados ${contentTypes.length} content-types para workspace ${workspace.name}`
    );
    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.warn(
      "⚠️ Could not connect to DB for content-types, using fallback data.",
      error.message
    );

    // FALLBACK: Content Types mock para teste
    const mockContentTypes = [
      {
        _id: "temp1",
        name: "Página Temporária",
        slug: "pagina-temp",
        description: "Content type temporário para desenvolvimento",
        userId: userId, // ← TRIANGULAÇÃO: associar ao usuário atual
        addons: [
          {
            id: "subtitulo",
            name: "Subtítulo",
            type: "textInput",
            required: false,
          },
          {
            id: "conteudo",
            name: "Conteúdo Principal",
            type: "textarea",
            required: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log(
      `🔄 Retornando ${mockContentTypes.length} content-types mock para usuário ${userId}`
    );
    return NextResponse.json({ contentTypes: mockContentTypes });
  }
}

/**
 * POST /api/content-types
 * Cria um novo content type e section correspondente
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { createDefaultSection = true, ...contentTypeData } = data;

    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    // Obter workspace ID do header (enviado pelo frontend)
    const workspaceId = request.headers.get("x-workspace-id");

    console.log("🔐 Content-types POST: userId =", userId);
    console.log("🏢 Content-types: Workspace solicitado:", workspaceId);

    // Obter workspace atual (específico ou fallback)
    const workspace = await getCurrentWorkspace(userId, workspaceId);
    console.log(
      `🏢 Content-types: Usando workspace: ${workspace.name} (${workspace._id})`
    );

    // ✅ MELHORIA: Usar validação robusta de slug
    const baseSlug = contentTypeData.slug || generateSlug(contentTypeData.name);
    const slugValidation = validateSlug(baseSlug);

    if (!slugValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid slug", details: slugValidation.errors },
        { status: 400 }
      );
    }

    const slug = slugValidation.slug;

    // 🐛 DEBUG: Logs detalhados
    console.log("🔍 === DEBUG CONTENT TYPE ===");
    console.log("🔍 Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("🔍 userId:", userId);
    console.log("🔍 workspaceId:", workspace._id);
    console.log("🔍 slug gerado:", slug);

    // Adicionar userId, workspaceId e slug aos dados
    const dataWithWorkspace = {
      ...contentTypeData,
      userId,
      workspaceId: workspace._id,
      slug,
    };

    console.log(
      "🔍 Dados para validação:",
      JSON.stringify(dataWithWorkspace, null, 2)
    );

    const validation = validateSchema(dataWithWorkspace, ContentTypeSchema);
    if (!validation.isValid) {
      console.error("❌ Falha na validação:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // ✅ MELHORIA: Verificar slug único usando função otimizada
    const isUnique = await isSlugUnique(slug, workspace._id, "contentTypes");

    if (!isUnique) {
      return NextResponse.json(
        {
          error: "Content type with this slug already exists in this workspace",
        },
        { status: 409 }
      );
    }

    // 1. Criar o Content Type usando o objeto já validado
    const contentTypeToInsert = dataWithWorkspace; // slug já está incluído

    const result = await db.insertOne("contentTypes", contentTypeToInsert);

    const newContentType = await db.findOne("contentTypes", {
      _id: result.insertedId,
    });

    // 2. Se solicitado, criar uma Section padrão para este Content Type
    let newSection = null;
    if (createDefaultSection) {
      try {
        const sectionSlug =
          contentTypeData.slug ||
          contentTypeData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const sectionResult = await db.insertOne("sections", {
          name: contentTypeData.name,
          slug: sectionSlug,
          contentTypeId: result.insertedId.toString(),
          userId: userId,
          workspaceId: workspace._id, // <-- GARANTIA EXPLÍCITA
          description: `Section criada automaticamente para ${contentTypeData.name}`,
          settings: {
            defaultView: "list",
            itemsPerPage: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        });

        newSection = await db.findOne("sections", {
          _id: sectionResult.insertedId,
        });

        console.log(
          `✅ Section padrão criada: "${contentTypeData.name}" → /${sectionSlug}`
        );
      } catch (sectionError) {
        console.warn("⚠️ Erro ao criar section padrão:", sectionError.message);
        // Não falhar a operação se a section não for criada
      }
    }

    return NextResponse.json({
      contentType: newContentType,
      section: newSection,
      message: createDefaultSection
        ? "Content Type e Section criados com sucesso"
        : "Content Type criado com sucesso",
    });
  } catch (error) {
    console.error("Error creating content type:", error);
    return NextResponse.json(
      { error: "Failed to create content type" },
      { status: 500 }
    );
  }
}
