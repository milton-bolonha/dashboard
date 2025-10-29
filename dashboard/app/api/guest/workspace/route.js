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
import { createTileDebugLogger } from "@/lib/tile-debug-logger";
import { buildPromptContext } from "@/lib/theme-context-mapper";
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

    // Incluir themeSnapshot e dynamicData se existirem
    const response = {
      ...guestWorkspace.workspace_data,
      limits: guestWorkspace.limits,
      usage: guestWorkspace.usage,
    };

    // Adicionar themeSnapshot se existir
    if (guestWorkspace.themeSnapshot) {
      response.themeSnapshot = guestWorkspace.themeSnapshot;
    }

    // ⭐ CRÍTICO: Mesclar dynamicData E workspace_data das entidades
    // Isso permite que o frontend acesse as entidades do tema (books, projects, etc.)
    if (guestWorkspace.dynamicData) {
      console.log(
        "🔍 DynamicData do banco:",
        JSON.stringify(guestWorkspace.dynamicData, null, 2)
      );

      // Mesclar cada entidade do dynamicData no response
      for (const [entityKey, entities] of Object.entries(
        guestWorkspace.dynamicData
      )) {
        if (Array.isArray(entities) && entities.length > 0) {
          // ⭐ CRÍTICO: Buscar entities do workspace_data também, com tiles
          let workspaceEntities = response[entityKey] || entities;

          console.log(
            `🔍 Buscando ${entityKey} em workspace_data:`,
            workspaceEntities
          );

          // ⭐ CRÍTICO: Converter objeto numerado para array se necessário
          if (
            !Array.isArray(workspaceEntities) &&
            typeof workspaceEntities === "object"
          ) {
            workspaceEntities = Object.values(workspaceEntities);
            console.log(`🔄 Convertido para array:`, workspaceEntities);
          }

          // Mesclar tiles e outros dados de workspace_data
          if (workspaceEntities && Array.isArray(workspaceEntities)) {
            // Mesclar entities do dynamicData com dados atualizados do workspace_data
            const mergedEntities = workspaceEntities.map((wsEntity, index) => {
              const dynamicEntity = entities[index] || {};
              const mergedEntity = {
                ...dynamicEntity,
                ...wsEntity, // workspace_data sobrescreve dynamicData
                // ⭐ CRÍTICO: Garantir tiles e status são incluídos
                tiles: wsEntity.tiles || dynamicEntity.tiles || [],
                tiles_status:
                  wsEntity.tiles_status ||
                  dynamicEntity.tiles_status ||
                  "pending",
                tiles_to_generate:
                  wsEntity.tiles_to_generate ||
                  dynamicEntity.tiles_to_generate ||
                  0,
              };

              console.log(
                `🔍 Debug merged entity para ${entityKey}[${index}]:`,
                {
                  hasTiles: !!mergedEntity.tiles,
                  tilesCount: mergedEntity.tiles?.length || 0,
                  tiles_status: mergedEntity.tiles_status,
                  tiles_to_generate: mergedEntity.tiles_to_generate,
                }
              );

              return mergedEntity;
            });

            response[entityKey] = mergedEntities;
            console.log(
              `✅ Entidade ${entityKey} mesclada no response com ${mergedEntities.length} items`
            );
            console.log(
              `🔍 Primeira entidade mesclada:`,
              JSON.stringify(mergedEntities[0], null, 2)
            );
          }
        }
      }
      response.dynamicData = guestWorkspace.dynamicData;
    }

    console.log("📤 Response final keys:", Object.keys(response));

    return NextResponse.json({
      success: true,
      workspace: response,
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

    // ⭐ Adicionar primaryEntity ao themeSnapshot para uso no preload
    const primaryEntityForSnapshot = selectedTheme?.entities?.find(
      (e) => e.isPrimary
    );
    const enhancedThemeSnapshot = {
      ...selectedTheme,
      primaryEntity: primaryEntityForSnapshot,
    };

    // ⭐ CRÍTICO: Adicionar tiles_status para todas as entidades no dynamicData
    const enrichedDynamicData = { ...dynamicData };
    for (const [key, entities] of Object.entries(enrichedDynamicData)) {
      if (Array.isArray(entities)) {
        enrichedDynamicData[key] = entities.map((entity) => ({
          ...entity,
          tiles_status: entity.tiles_status || "pending",
          tiles: entity.tiles || [],
        }));
      }
    }

    // Criar novo workspace com estrutura híbrida (antiga + nova)
    const newWorkspace = {
      guest_id: guestId,
      // ⭐ NOVO: Campos de tema
      themeId: selectedTheme.id,
      themeSnapshot: enhancedThemeSnapshot,
      dynamicData: enrichedDynamicData,

      // Backward compatibility: manter estrutura antiga + dynamic entities
      workspace_data: {
        name: primaryEntityName || "My Workspace",
        ...enrichedDynamicData, // ⭐ CRÍTICO: Incluir todas as entidades do tema com tiles_status
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

    // ⭐ Definir entityKey fora do try/catch para uso no catch
    let entityKey = "companies"; // default

    (async () => {
      try {
        console.log("🚀 Disparando geração de tiles em background...");

        // 🎯 NOVO: Usar tileTemplates do tema ao invés de template hardcoded
        let selectedTemplate;

        if (
          selectedTheme.tileTemplates &&
          selectedTheme.tileTemplates.length > 0
        ) {
          // Usar tiles do tema (dinâmico - funciona para qualquer tema)
          console.log(`📋 Usando tileTemplates do tema ${selectedTheme.id}`);
          selectedTemplate = {
            id: `theme_${selectedTheme.id}`,
            name: `${selectedTheme.name} Templates`,
            tiles: selectedTheme.tileTemplates,
          };
        } else {
          // Fallback para templates legados (Sales Assistant)
          const { getGuestTemplate } = await import("@/lib/guest-templates");
          const templateId = value.template_id || "template_1";
          selectedTemplate = getGuestTemplate(templateId);
          console.log(`📋 Usando template legado: ${selectedTemplate.name}`);
        }

        console.log(`🎯 Tiles a gerar: ${selectedTemplate.tiles.length}`);

        if (selectedTemplate && selectedTemplate.tiles.length > 0) {
          // Buscar dados da primeira entidade
          const primaryEntity = selectedTheme.entities.find((e) => e.isPrimary);
          entityKey = primaryEntity.id.endsWith("s")
            ? primaryEntity.id
            : `${primaryEntity.id}s`; // companies, books, projects

          if (entityKey === "companys") {
            entityKey = "companies";
          }

          // ⭐ FIX: Buscar em workspace_data que já foi criado, não em dynamicData
          // Após criar o workspace, as entidades estão em workspace_data[entityKey]
          const firstEntity =
            dynamicData[entityKey]?.[0] ||
            newWorkspace.workspace_data[entityKey]?.[0];

          if (!firstEntity) {
            console.warn("⚠️ Nenhuma entidade encontrada para gerar tiles");
            console.warn("- entityKey:", entityKey);
            console.warn("- dynamicData keys:", Object.keys(dynamicData));
            console.warn(
              "- workspace_data keys:",
              Object.keys(newWorkspace.workspace_data)
            );
            return;
          }

          // ⭐ NOVO: Verificar se já está gerando (prevent duplicação)
          if (
            firstEntity.tiles_status === "generating" ||
            firstEntity.tiles?.length > 0
          ) {
            console.log(
              "⏭️ Pulando geração - tiles já sendo gerados ou já existem"
            );
            return;
          }

          // ⭐ CRÍTICO: Definir total esperado de tiles
          const totalTiles = selectedTemplate.tiles.length;

          console.log(`📊 Total de tiles esperados: ${totalTiles}`);
          console.log(`📊 Entity key: ${entityKey}`);

          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $set: {
                [`workspace_data.${entityKey}.0.tiles_to_generate`]: totalTiles,
                [`workspace_data.${entityKey}.0.tiles_status`]: "generating",
                // ⭐ NOVO: Também atualizar em dynamicData para consistência
                [`dynamicData.${entityKey}.0.tiles_to_generate`]: totalTiles,
                [`dynamicData.${entityKey}.0.tiles_status`]: "generating",
              },
            }
          );

          console.log(`🚀 Iniciando geração de ${totalTiles} tiles...`);

          // Usar sistema de pipeline do guest com callback para salvar cada tile
          const { generateAllTilesOptimized } = await import(
            "@/lib/ai-tile-generator-optimized"
          );
          const { optimizeTiles } = await import("@/lib/prompt-optimizer");

          // ⭐ FIX: Importar processPromptVariables do lugar correto
          const { processPromptVariables } = await import(
            "@/lib/guest-templates"
          );

          // 🎯 NOVO: Construir contexto dinamicamente baseado no tema
          const promptContext = buildPromptContext(
            selectedTheme,
            firstEntity,
            value.context
          );

          console.log("📊 Theme:", selectedTheme.id);
          console.log("📊 Entity:", firstEntity);
          console.log("📊 Original context:", value.context);
          console.log(
            "🎯 Contexto processado:",
            JSON.stringify(promptContext, null, 2)
          );

          // ⭐ CORREÇÃO: Filtrar tiles que já foram gerados pelo preload
          // Preload gera os 2 primeiros (What They Do + Revenue Generation)
          const preloadedTileIds = ["company_description", "revenue_model"];

          const tilesToGenerate = selectedTemplate.tiles.filter(
            (tile) => !preloadedTileIds.includes(tile.id)
          );

          console.log(`📊 Total tiles: ${selectedTemplate.tiles.length}`);
          console.log(`📊 Tiles preloaded: ${preloadedTileIds.length}`);
          console.log(
            `📊 Tiles a gerar em background: ${tilesToGenerate.length}`
          );

          const tiles = tilesToGenerate.map((tile) => ({
            id: tile.id,
            title: tile.title,
            prompt: processPromptVariables(tile.prompt, promptContext),
            category: tile.category,
            order: tile.order,
          }));

          const optimizedTiles = optimizeTiles(tiles, promptContext);

          // Callback para salvar cada tile gerado
          const saveTileCallback = async (generatedTile) => {
            // Adicionar o tile gerado ao array
            await db.updateOne(
              "guest_workspaces",
              { guest_id: guestId },
              {
                $push: {
                  [`workspace_data.${entityKey}.0.tiles`]: generatedTile,
                },
                $inc: { "usage.total_tiles_generated": 1 },
              }
            );
            console.log(`✅ Tile "${generatedTile.title}" salvo no DB`);
          };

          // Gerar tiles em background com callback
          await generateAllTilesOptimized(optimizedTiles, promptContext, {
            onTileCompleted: saveTileCallback,
          });

          // Marcar como completed após todos os tiles serem salvos
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $set: {
                [`workspace_data.${entityKey}.0.tiles_status`]: "completed",
                [`dynamicData.${entityKey}.0.tiles_status`]: "completed",
              },
            }
          );

          console.log(`✅ Geração de tiles finalizada`);
        } else {
          console.log(`⚠️ Sem tiles para gerar`);
        }
      } catch (e) {
        console.error("⚠️ Erro ao iniciar geração de tiles:", e);

        // ⭐ CRÍTICO: Atualizar status para "partial" em caso de erro
        // Isso evita que fique "generating" para sempre
        try {
          await db.updateOne(
            "guest_workspaces",
            { guest_id: guestId },
            {
              $set: {
                [`workspace_data.${entityKey}.0.tiles_status`]: "partial",
                [`dynamicData.${entityKey}.0.tiles_status`]: "partial",
              },
            }
          );
          console.log(`✅ Status atualizado para "partial" após erro`);
        } catch (dbError) {
          console.error("❌ Erro ao atualizar status:", dbError);
        }
      }

      console.log("✅ Geração de tiles iniciada em background");
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
