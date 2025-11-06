/**
 * Guest Workspace API
 * GET: Busca configurações do workspace
 * POST: Cria novo guest workspace (onboarding)
 * PUT: Atualiza configurações do workspace (background, etc.)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { withMongoErrorHandler } from "@/lib/withMongoErrorHandler";
import { withMongoConnectionHandler } from "@/lib/withMongoConnectionHandler";
import { createDynamicWorkspace } from "@/lib/dynamic-workspace";
import { createTileDebugLogger } from "@/lib/tile-debug-logger";
import { buildPromptContext } from "@/lib/theme-context-mapper";
import Joi from "joi";
import { getJob } from "@/lib/db/prompt-jobs";
import crypto from "crypto";
import { getWorkspaceCache, setWorkspaceCache } from "@/lib/workspace-cache";

// ⭐ IMPORTANTE: Desabilitar cache do Next.js para garantir que nosso cache em memória funcione corretamente
// No Next.js 15, Route Handlers GET não são cached por default, mas é recomendado ser explícito
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  // ⭐ RE-ADICIONADO: Permitir atualização de tiles
  companyName: Joi.string().optional(),
  tiles: Joi.array().items(Joi.object()).optional(),
  tiles_status: Joi.string()
    .valid("pending", "generating", "completed", "partial", "failed")
    .optional(),
})
  .min(1)
  .unknown(true); // min(1) exige pelo menos um campo; unknown(true) permite outros campos

const shouldLogVerbose = process.env.WORKSPACE_VERBOSE_LOGS === "true";
const vLog = (...args) => {
  if (shouldLogVerbose) console.log(...args);
};
const vWarn = (...args) => {
  if (shouldLogVerbose) console.warn(...args);
};

/**
 * GET /api/guest/workspace
 * Busca configurações do workspace
 */
const getWorkspaceHandler = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guest_id");
    const jobId = searchParams.get("job_id");
    const token = searchParams.get("token");

    // No modo "job", a autenticação é obrigatória
    if (jobId) {
      if (!guestId || !token) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required for job-specific workspace access",
          },
          { status: 401 }
        );
      }
      const job = await getJob(jobId);
      if (!job) {
        return NextResponse.json(
          { success: false, error: "Job not found" },
          { status: 404 }
        );
      }
      if (job.guestId !== guestId) {
        return NextResponse.json(
          { success: false, error: "Guest ID mismatch for this job" },
          { status: 403 }
        );
      }
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      if (job.accessTokenHash !== tokenHash) {
        return NextResponse.json(
          { success: false, error: "Invalid access token for this job" },
          { status: 403 }
        );
      }
      vLog(`✅ [GET /api/guest/workspace] Acesso autorizado para job ${jobId}`);
    } else if (!guestId) {
      // Se não for modo job, o guestId (do cookie, por ex.) ainda é necessário
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

      vLog(`🔄 Workspace migrado: limits e usage adicionados`);
    }

    vLog("✅ Workspace encontrado");

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
      vLog(
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

          vLog(
            `🔍 Buscando ${entityKey} em workspace_data:`,
            workspaceEntities
          );

          // ⭐ CRÍTICO: Converter objeto numerado para array se necessário
          if (
            !Array.isArray(workspaceEntities) &&
            typeof workspaceEntities === "object"
          ) {
            workspaceEntities = Object.values(workspaceEntities);
            vLog(`🔄 Convertido para array:`, workspaceEntities);
          }

          // Mesclar tiles e outros dados de workspace_data
          if (workspaceEntities && Array.isArray(workspaceEntities)) {
            // ⭐ BUG FIX: Buscar template para obter tiles_to_generate dinamicamente
            let templateTilesCount = 0;
            try {
              const { getGuestTemplate } = await import(
                "@/lib/guest-templates"
              );
              const templateId =
                guestWorkspace.template_id ||
                guestWorkspace.workspace_data?.template_id ||
                "template_1";
              const template = getGuestTemplate(templateId);
              templateTilesCount = template?.tiles?.length || 0;
              vLog(`📊 Template ${templateId} tem ${templateTilesCount} tiles`);
            } catch (templateError) {
              vWarn(
                "⚠️ Erro ao buscar template para tiles_to_generate:",
                templateError
              );
            }

            // Mesclar entities do dynamicData com dados atualizados do workspace_data
            const mergedEntities = workspaceEntities.map((wsEntity, index) => {
              const dynamicEntity = entities[index] || {};

              // ⭐ BUG FIX: tiles_to_generate deve ser dinâmico baseado no template
              // Se não existe ou é 0, usar o tamanho do template
              let tilesToGenerate =
                wsEntity.tiles_to_generate ||
                dynamicEntity.tiles_to_generate ||
                templateTilesCount ||
                8;

              if (wsEntity.tiles_to_generate === 0 && templateTilesCount > 0) {
                vLog(
                  `🔄 tiles_to_generate corrigido de 0 para ${templateTilesCount} (baseado no template)`
                );
                tilesToGenerate = templateTilesCount;
              }

              // Se um job_id for fornecido, filtre os tiles para incluir apenas os desse job.
              if (jobId) {
                vLog(
                  `🔍 Filtrando tiles para o job_id: ${jobId} de um total de ${
                    wsEntity.tiles?.length || 0
                  } tiles.`
                );

                // ⭐ CORREÇÃO: Filtrar por jobId OU por ID que contém o jobId
                const jobTiles = (wsEntity.tiles || []).filter((t) => {
                  // Verificar campo jobId direto
                  if (t.jobId === jobId) return true;
                  // Verificar se o ID do tile contém o jobId (formato: tile_job_mhn7bhat_0)
                  if (t.id && typeof t.id === "string") {
                    return (
                      t.id.includes(`_${jobId}_`) ||
                      t.id.startsWith(`tile_${jobId}_`)
                    );
                  }
                  return false;
                });

                if (jobTiles.length > 0) {
                  vLog(
                    `✅ Encontrados ${jobTiles.length} tiles para o job ${jobId}.`
                  );
                  vLog(
                    `🔍 Primeiros 3 tiles:`,
                    jobTiles.slice(0, 3).map((t) => ({
                      id: t.id,
                      jobId: t.jobId,
                      title: t.title,
                    }))
                  );
                  wsEntity.tiles = jobTiles;
                } else {
                  vLog(
                    `⚠️ Nenhum tile correspondente ao job ${jobId} encontrado. Tiles disponíveis:`,
                    (wsEntity.tiles || [])
                      .slice(0, 3)
                      .map((t) => ({ id: t.id, jobId: t.jobId }))
                  );
                  wsEntity.tiles = []; // Retorna vazio, mas apenas para a resposta da API, não altera o DB
                }
              }

              // Mescla a entidade encontrada no workspace com os dados dinâmicos
              const mergedEntity = {
                ...dynamicEntity,
                ...wsEntity,
                tiles: wsEntity.tiles || dynamicEntity.tiles || [],
                tiles_to_generate: tilesToGenerate, // ⭐ CORREÇÃO: Força o uso do valor recalculado
              };

              // ⭐ CORREÇÃO CRÍTICA 2: Recalcular o status da company/entidade.
              // Usar o `tilesToGenerate` recalculado para a comparação.
              if (
                mergedEntity.tiles &&
                mergedEntity.tiles.length >= tilesToGenerate &&
                tilesToGenerate > 0
              ) {
                vLog(
                  `✅ Status recalculado para 'completed' (${mergedEntity.tiles.length}/${tilesToGenerate} tiles)`
                );
                mergedEntity.tiles_status = "completed";
              }

              vLog(`🔍 Debug merged entity para ${entityKey}[${index}]:`, {
                hasTiles: !!mergedEntity.tiles,
                tilesCount: mergedEntity.tiles?.length || 0,
                tiles_status: mergedEntity.tiles_status,
                tiles_to_generate: mergedEntity.tiles_to_generate,
              });

              return mergedEntity;
            });

            // ⭐ NOVO: Detecção de jobs presos (generating há muito tempo sem tiles)
            // Fazer após o map para poder usar await
            if (jobId) {
              for (let i = 0; i < mergedEntities.length; i++) {
                const mergedEntity = mergedEntities[i];
                if (
                  mergedEntity.tiles_status === "generating" ||
                  mergedEntity.tiles_status === "pending"
                ) {
                  try {
                    const job = await getJob(jobId);
                    if (job) {
                      const jobCreatedAt = job.createdAt
                        ? new Date(job.createdAt)
                        : null;
                      const jobUpdatedAt = job.updatedAt
                        ? new Date(job.updatedAt)
                        : null;
                      const now = new Date();

                      // Verificar se job está preso (criado há mais de 5 minutos e sem tiles)
                      const JOB_STUCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
                      const timeSinceCreation = jobCreatedAt
                        ? now - jobCreatedAt
                        : 0;
                      const timeSinceUpdate = jobUpdatedAt
                        ? now - jobUpdatedAt
                        : 0;
                      const hasNoTiles =
                        !mergedEntity.tiles || mergedEntity.tiles.length === 0;
                      const isStuck =
                        (timeSinceCreation > JOB_STUCK_TIMEOUT_MS ||
                          timeSinceUpdate > JOB_STUCK_TIMEOUT_MS) &&
                        hasNoTiles &&
                        (job.status === "QUEUED" || job.status === "RUNNING");

                      if (isStuck) {
                        vWarn(
                          `⚠️ Job ${jobId} parece estar preso (criado há ${Math.round(
                            timeSinceCreation / 1000
                          )}s, atualizado há ${Math.round(
                            timeSinceUpdate / 1000
                          )}s, sem tiles). Mudando status para 'failed'.`
                        );
                        mergedEntity.tiles_status = "failed";

                        // Opcional: Atualizar job no banco (comentado para não causar side effects)
                        // await updateJob(jobId, { status: "FAILED", error: "Job stuck: no tiles generated after timeout" });
                      }
                    }
                  } catch (jobError) {
                    vWarn(
                      `⚠️ Erro ao verificar job ${jobId} para detecção de jobs presos:`,
                      jobError
                    );
                    // Não falhar a requisição se houver erro ao verificar job
                  }
                }
              }
            }

            response[entityKey] = mergedEntities;
            vLog(
              `✅ Entidade ${entityKey} mesclada no response com ${mergedEntities.length} items`
            );
            vLog(
              `🔍 Primeira entidade mesclada:`,
              JSON.stringify(mergedEntities[0], null, 2)
            );
          }
        }
      }
      response.dynamicData = guestWorkspace.dynamicData;
    }

    vLog("📤 Response final keys:", Object.keys(response));

    // ⭐ FASE 1: Cache + ETag
    const cached = getWorkspaceCache(guestId, jobId);

    // Calcular ETag do response
    const responseString = JSON.stringify(response);
    const etag = crypto.createHash("md5").update(responseString).digest("hex");

    // Verificar If-None-Match do cliente
    const ifNoneMatch = req.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      vLog(
        `[Workspace Cache] ✅ 304 Not Modified (ETag: ${etag.substring(
          0,
          8
        )}...)`
      );
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "private, max-age=1",
        },
      });
    }

    // Verificar cache válido
    if (cached) {
      vLog(
        `[Workspace Cache] ✅ Cache hit (${
          Date.now() - cached.timestamp
        }ms old)`
      );
      return NextResponse.json(
        {
          success: true,
          workspace: cached.data,
          message: "Workspace retrieved successfully",
        },
        {
          headers: {
            ETag: cached.etag,
            "Cache-Control": "private, max-age=1",
          },
        }
      );
    }

    // Cache miss ou expirado - buscar do MongoDB
    vLog(
      `[Workspace Cache] ❌ Cache miss ou expirado para ${guestId}:${
        jobId || "default"
      }`
    );

    // Cachear resultado
    setWorkspaceCache(guestId, jobId, response, etag);

    return NextResponse.json(
      {
        success: true,
        workspace: response,
        message: "Workspace retrieved successfully",
      },
      {
        headers: {
          ETag: etag,
          "Cache-Control": "private, max-age=1",
        },
      }
    );
  } catch (error) {
    throw error;
  }
};

export const GET = withMongoConnectionHandler(
  withMongoErrorHandler(getWorkspaceHandler, {
    message: "Failed to retrieve workspace",
  }),
  {
    label: "guest-workspace:get",
    stage: "guest-workspace",
  }
);

/**
 * POST /api/guest/workspace
 * Cria novo guest workspace (onboarding)
 */
const createWorkspaceHandler = async (req) => {
  try {
    console.log("📥 POST /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    let guestId = cookieStore.get("guest_id")?.value;
    let shouldSetCookie = false;

    // ⭐ FALLBACK: Se não há cookie, tentar da query string (fluxo job_id)
    if (!guestId) {
      const { searchParams } = new URL(req.url);
      guestId = searchParams.get("guest_id");
      console.log(
        "🔍 guest_id não encontrado no cookie, tentando query string:",
        guestId
      );

      // ⭐ IMPORTANTE: Se guest_id veio da query string, precisamos definir no cookie
      if (guestId) {
        shouldSetCookie = true;
      }
    }

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    // ⭐ CORREÇÃO: Tratar body vazio ou inválido
    let body = {};
    try {
      const bodyText = await req.text();
      if (bodyText && bodyText.trim().length > 0) {
        body = JSON.parse(bodyText);
        console.log("📦 Body:", JSON.stringify(body, null, 2));
      } else {
        console.warn("⚠️ POST /api/guest/workspace - Body vazio ou ausente");
        body = {}; // Usar objeto vazio
      }
    } catch (parseError) {
      console.error("❌ Erro ao parsear body:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ⭐ DEBUG: Log completo do contexto recebido
    console.log("📦 ========== WORKSPACE CREATE REQUEST ==========");
    console.log("📦 guestId:", guestId);
    console.log("📦 body.context:", body.context);
    console.log("📦 body.context.companyName:", body.context?.companyName);
    console.log("📦 body.context.companyUrl:", body.context?.companyUrl);
    console.log("📦 body.context.solution:", body.context?.solution);
    console.log("📦 ==============================================");

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

          // ⭐ CORREÇÃO: Passar theme para normalização de contexto
          const optimizedTiles = optimizeTiles(
            tiles,
            promptContext,
            selectedTheme
          );

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

    const response = NextResponse.json({
      success: true,
      guest_id: guestId,
      workspace: newWorkspace.workspace_data,
      message: "Guest workspace created successfully",
    });

    // ⭐ IMPORTANTE: Definir cookie se veio da query string
    if (shouldSetCookie) {
      response.cookies.set("guest_id", guestId, {
        httpOnly: false, // Acesso via JS (para logs)
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
      });
    }

    return response;
  } catch (error) {
    throw error;
  }
};

export const POST = withMongoConnectionHandler(
  withMongoErrorHandler(createWorkspaceHandler, {
    message: "Failed to create workspace",
  }),
  {
    label: "guest-workspace:post",
    stage: "guest-workspace",
  }
);

/**
 * PUT /api/guest/workspace
 * Atualiza configurações do workspace
 */
const updateWorkspaceHandler = async (req) => {
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

    let body = {};
    try {
      const bodyText = await req.text();
      if (bodyText && bodyText.trim().length > 0) {
        body = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.error("❌ Erro ao parsear body:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { error, value } = workspaceUpdateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (value.dashboardBackground) {
      updateData["workspace_data.dashboardBackground"] =
        value.dashboardBackground;
    }

    // ⭐ RE-ADICIONADO: Lógica para atualizar tiles de uma company específica
    if (value.companyName && Array.isArray(value.tiles)) {
      const theme = guestWorkspace.themeSnapshot;
      let entityKey = "companies";
      if (theme) {
        const primaryEntity = theme.entities.find((e) => e.isPrimary);
        if (primaryEntity) {
          entityKey = `${primaryEntity.id}s`.replace("companys", "companies");
        }
      }

      const companies = guestWorkspace.workspace_data?.[entityKey] || [];
      const companyIndex = companies.findIndex(
        (c) => c.name === value.companyName
      );

      if (companyIndex > -1) {
        console.log(
          `✅ Atualizando tiles para ${value.companyName} no índice ${companyIndex}`
        );
        updateData[`workspace_data.${entityKey}.${companyIndex}.tiles`] =
          value.tiles;

        if (value.tiles_status) {
          updateData[
            `workspace_data.${entityKey}.${companyIndex}.tiles_status`
          ] = value.tiles_status;
        }
      } else {
        console.warn(
          `⚠️ Company ${value.companyName} não encontrada para atualização de tiles.`
        );
      }
    }

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      { $set: updateData }
    );

    console.log("✅ Workspace atualizado:", Object.keys(updateData));

    return NextResponse.json({
      success: true,
      message: "Workspace updated successfully",
    });
  } catch (error) {
    throw error;
  }
};

export const PUT = withMongoConnectionHandler(
  withMongoErrorHandler(updateWorkspaceHandler, {
    message: "Failed to update workspace",
  }),
  {
    label: "guest-workspace:put",
    stage: "guest-workspace",
  }
);
