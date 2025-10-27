/**
 * Guest Workspace API
 * GET: Busca configurações do workspace
 * POST: Cria novo guest workspace (onboarding)
 * PUT: Atualiza configurações do workspace (background, etc.)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createDynamicWorkspace } from "@/lib/dynamic-workspace";
import Joi from "joi";

const workspaceCreateSchema = Joi.object({
  template_id: Joi.string().optional(), // Backward compatibility
  themeId: Joi.string().optional(), // Novo campo para temas
  context: Joi.object().required(),
}).strict();

const workspaceUpdateSchema = Joi.object({
  dashboardBackground: Joi.object({
    type: Joi.string().valid("solid", "image").required(),
    value: Joi.string().required(),
  }).optional(),
}).strict();

/**
 * GET /api/guest/workspace
 * Busca configurações do workspace
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // 🔧 MIGRAÇÃO: Adicionar limits/usage se não existirem (workspaces antigos)
    if (!guestWorkspace.limits || !guestWorkspace.usage) {
      const currentCompaniesCount =
        guestWorkspace.workspace_data?.companies?.length || 1;

      await db.updateOne(
        "guest_workspaces",
        { guest_id: guestId },
        {
          $set: {
            limits: {
              max_companies: 3,
              max_tiles_per_company: 10,
              max_templates: 5,
            },
            usage: {
              companies_count: currentCompaniesCount,
              companies_remaining: 3 - currentCompaniesCount,
              total_tiles_generated: 0,
              templates_created: 0,
              last_activity: new Date(),
            },
          },
        }
      );

      // Atualizar objeto local
      guestWorkspace.limits = {
        max_companies: 3,
        max_tiles_per_company: 10,
        max_templates: 5,
      };
      guestWorkspace.usage = {
        companies_count: currentCompaniesCount,
        companies_remaining: 3 - currentCompaniesCount,
        total_tiles_generated: 0,
        templates_created: 0,
        last_activity: new Date(),
      };

      console.log(`🔄 Workspace migrado: limits e usage adicionados`);
    }

    console.log("✅ Workspace encontrado");

    return NextResponse.json({
      success: true,
      workspace: {
        ...guestWorkspace.workspace_data,
        limits: guestWorkspace.limits,
        usage: guestWorkspace.usage,
      },
      message: "Workspace retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao buscar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve workspace" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/workspace
 * Cria novo guest workspace (onboarding)
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = workspaceCreateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Verificar se workspace já existe
    const existingWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (existingWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace already exists" },
        { status: 409 }
      );
    }

    // ⭐ NOVO: Buscar tema selecionado
    let selectedTheme = null;
    const themeId = value.themeId || value.context?.themeId;

    if (themeId) {
      selectedTheme = await db.findOne("themes", { id: themeId });
    }

    // Se não encontrar tema no DB, buscar do BASE_THEMES
    if (!selectedTheme && themeId) {
      const { BASE_THEMES } = await import("@/lib/base-themes");
      const themeKey = Object.keys(BASE_THEMES).find(
        (key) => BASE_THEMES[key].id === themeId
      );
      if (themeKey) {
        selectedTheme = BASE_THEMES[themeKey];
      }
    }

    // Se ainda não encontrou, usar default
    if (!selectedTheme) {
      selectedTheme = await db.findOne("themes", { isDefault: true });
    }

    // Se ainda não tem, usar o primeiro tema do BASE_THEMES
    if (!selectedTheme) {
      const { BASE_THEMES } = await import("@/lib/base-themes");
      selectedTheme = Object.values(BASE_THEMES)[0];
    }

    if (!selectedTheme) {
      return NextResponse.json({ error: "No theme found" }, { status: 500 });
    }

    // ⭐ NOVO: Criar workspace dinâmico baseado no tema
    const dynamicData = await createDynamicWorkspace(
      selectedTheme,
      value.context
    );

    // Backward compatibility: criar estrutura antiga também
    // Extrair nome da primeira entidade principal do dynamicData
    let primaryEntityName = "Target";
    let primaryEntityWebsite = "";

    // Buscar a primeira entidade principal (ex: books, companies, projects)
    for (const [entityKey, entities] of Object.entries(dynamicData)) {
      if (Array.isArray(entities) && entities.length > 0) {
        const firstEntity = entities[0];
        // Tentar pegar 'name' ou o primeiro campo que pareça um nome/título
        primaryEntityName =
          firstEntity.name || firstEntity.title || primaryEntityName;
        primaryEntityWebsite = firstEntity.website || "";
        break;
      }
    }

    const company = {
      id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: primaryEntityName,
      website: primaryEntityWebsite,
      industry: "Unknown",
      description: `Research target: ${primaryEntityName}`,
      tiles: [],
      contacts: [],
      notes: [],
      files: [],
      tiles_status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Criar novo workspace com estrutura híbrida (antiga + nova)
    const newWorkspace = {
      guest_id: guestId,
      // ⭐ NOVO: Campos de tema
      themeId: selectedTheme.id,
      themeSnapshot: selectedTheme,
      dynamicData: dynamicData,

      // Backward compatibility: manter estrutura antiga
      workspace_data: {
        name: primaryEntityName || "My Workspace",
        companies: [company],
        tiles: [],
        templates: [],
        dashboardBackground: null,
      },
      template_id: value.template_id,
      context: value.context,

      // Limites do guest workspace
      limits: {
        max_companies: 3,
        max_tiles_per_company: 10,
        max_templates: 5,
      },

      // Uso atual
      usage: {
        companies_count: 1,
        companies_remaining: 2,
        total_tiles_generated: 0,
        templates_created: 0,
        last_activity: new Date(),
      },

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insertOne("guest_workspaces", newWorkspace);

    console.log("✅ Guest workspace criado:", guestId);

    // 🚀 INICIAR GERAÇÃO DE TILES EM BACKGROUND
    // Não bloquear a resposta, gerar em background para que o redirecionamento seja instantâneo
    (async () => {
      try {
        console.log("🚀 Disparando geração de tiles em background...");

        // ⭐ USAR TILES DO TEMA EM VEZ DE TEMPLATE GENÉRICO
        if (
          selectedTheme?.tileTemplates &&
          selectedTheme.tileTemplates.length > 0
        ) {
          console.log(`🎨 Usando tiles do tema: ${selectedTheme.name}`);
          console.log(
            `📋 Tiles disponíveis:`,
            selectedTheme.tileTemplates.length
          );

          // TODO: Implementar geração de tiles baseada no tema
          // Por enquanto, pular geração automática para temas que não sejam Sales
          if (selectedTheme.id === "sales-assistant") {
            // Importar gerador apenas para Sales (backward compatibility)
            const { generateTilesForCompany } = await import(
              "@/lib/guest-tile-pipeline"
            );
            const { getGuestTemplate } = await import("@/lib/guest-templates");

            const templateId = value.template_id || "template_1";
            const template = getGuestTemplate(templateId);

            await generateTilesForCompany(
              guestId,
              primaryEntityName,
              company.website,
              template
            );
          } else {
            console.log(
              `⏭️ Geração automática de tiles desabilitada para tema ${selectedTheme.name}`
            );
            console.log(
              `💡 Implementar geração baseada em tileTemplates do tema`
            );
          }
        }

        console.log("✅ Geração de tiles iniciada em background");
      } catch (e) {
        console.error("⚠️ Erro ao iniciar geração de tiles:", e);
        // Não quebrar o fluxo, workspace já foi criado
      }
    })();

    return NextResponse.json({
      success: true,
      guest_id: guestId,
      workspace: newWorkspace.workspace_data,
      message: "Guest workspace created successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao criar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guest/workspace
 * Atualiza configurações do workspace
 */
export async function PUT(req) {
  try {
    console.log("📥 PUT /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = workspaceUpdateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Atualizar workspace
    const updateData = {
      updatedAt: new Date(),
    };

    if (value.dashboardBackground) {
      updateData["workspace_data.dashboardBackground"] =
        value.dashboardBackground;
    }

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      { $set: updateData }
    );

    console.log("✅ Workspace atualizado:", updateData);

    return NextResponse.json({
      success: true,
      message: "Workspace updated successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
