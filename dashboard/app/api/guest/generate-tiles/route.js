/**
 * Guest Tiles Generation API
 * POST: Gera tiles para guest workspace (chamado pelo frontend)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";
import { generateTileWithOpenAI } from "@/lib/ai-tile-generator";
import { generateAllTilesOptimized } from "@/lib/ai-tile-generator-optimized";
import { optimizeTiles } from "@/lib/prompt-optimizer";
import { createPipelineContext } from "@/lib/ai-pipeline-logger";
import { buildPromptContext } from "@/lib/theme-context-mapper";

// Helper function to update a single tile in the nested array
async function updateCompanyTile(guest_id, companyName, tile) {
  await db.updateOne(
    "guest_workspaces",
    {
      guest_id: guest_id,
      "workspace_data.companies.name": companyName,
    },
    {
      $push: { "workspace_data.companies.$.tiles": tile },
    }
  );
}

/**
 * POST /api/guest/generate-tiles
 * Gera tiles para uma company específica no guest workspace
 * Body: { companyName?: string } - Se não informado, gera para companies[0]
 */
export async function POST(req) {
  try {
    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    // Testar conexão MongoDB com retry
    let dbConnected = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!dbConnected && retryCount < maxRetries) {
      try {
        await db.findOne("guest_workspaces", { guest_id: guestId });
        dbConnected = true;
        console.log("✅ MongoDB connection successful");
      } catch (dbError) {
        retryCount++;
        console.error(
          `❌ MongoDB connection failed (attempt ${retryCount}/${maxRetries}):`,
          dbError.message
        );

        if (retryCount >= maxRetries) {
          if (
            dbError.message.includes("Server selection timed out") ||
            dbError.message.includes("MongoNetworkTimeoutError")
          ) {
            return NextResponse.json(
              {
                error:
                  "Database connection timeout. Please try again in a moment.",
                type: "database_timeout",
              },
              { status: 503 }
            );
          }
          throw dbError;
        }

        // Aguardar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
      }
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

    // Pegar nome da company do body (opcional)
    const body = await req.json().catch(() => ({}));
    const targetCompanyName = body.companyName;

    // Encontrar a company (por nome ou primeira)
    let company;
    let companyIndex;

    if (targetCompanyName) {
      companyIndex = guestWorkspace.workspace_data.companies.findIndex(
        (c) => c.name === targetCompanyName
      );
      if (companyIndex === -1) {
        return NextResponse.json(
          { error: `Company "${targetCompanyName}" not found` },
          { status: 404 }
        );
      }
      company = guestWorkspace.workspace_data.companies[companyIndex];
    } else {
      company = guestWorkspace.workspace_data.companies[0];
      companyIndex = 0;
    }

    console.log(
      `🚀 Gerando tiles para company: "${company.name}" (index: ${companyIndex})`
    );

    // ⭐ CRÍTICO: Verificar se tiles já foram gerados ou se já está em geração
    console.log(`🔍 Status atual:`, {
      status: company.tiles_status,
      generation_in_progress: company.generation_in_progress,
      tiles_count: company.tiles?.length || 0,
    });

    if (company.tiles_status === "completed") {
      console.log(
        `✅ Tiles já foram gerados (${company.tiles?.length || 0} tiles)`
      );
      return NextResponse.json({
        success: true,
        message: "Tiles already generated",
        tiles: company.tiles,
      });
    }

    // ⭐ Verificar se já está gerando (mas não bloquear com 409 - apenas log)
    if (company.tiles_status === "generating") {
      console.log(`🔄 Tiles já estão sendo gerados - apenas retornar sucesso`);
      return NextResponse.json({
        success: true,
        message: "Tiles generation already in progress",
        status: "generating",
      });
    }

    // Consolidado: Setar lock + status em uma única operação
    const lockId = `lock_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // OTIMIZADO: Usar findOneAndUpdate para consolidar busca + update
    const { value: updatedWorkspace } = await db.findOneAndUpdate(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": company.name,
      },
      {
        $set: {
          "workspace_data.companies.$.tiles_status": "generating",
          "workspace_data.companies.$.generation_in_progress": true,
          "workspace_data.companies.$.generation_started_at": new Date(),
          "workspace_data.companies.$.generation_lock_id": lockId,
        },
      },
      { returnDocument: "after" }
    );

    // Atualizar referência da company após o update
    if (updatedWorkspace) {
      company = updatedWorkspace.workspace_data.companies.find(
        (c) => c.name === company.name
      );
    }

    // Buscar template
    const template = getGuestTemplate(
      guestWorkspace.workspace_data.template_id
    );

    // 🎯 NOVO: Construir contexto dinamicamente baseado no tema
    const theme = guestWorkspace.themeSnapshot;
    const tileContext = buildPromptContext(
      theme,
      company, // Entidade atual (company, book, project, etc.)
      guestWorkspace.context
    );

    console.log("🔍 Contexto para geração de tiles:");
    console.log("📊 Theme:", theme?.id);
    console.log("📊 Entity:", company);
    console.log("🎯 Contexto gerado:", JSON.stringify(tileContext, null, 2));

    // Processar prompts do template
    const baseTiles = template.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: processPromptVariables(tile.prompt, tileContext),
      category: tile.category,
      order: tile.order,
    }));

    // ⭐ CORREÇÃO: Passar theme para normalização de contexto
    const { optimizeTiles } = await import("@/lib/prompt-optimizer");
    const optimizedTiles = optimizeTiles(baseTiles, tileContext, theme);

    // --- Geração Assíncrona de Tiles ---

    // Criar contexto de logging
    const pipelineLogger = createPipelineContext({
      guestId,
      companyName: company.name,
    });

    // Logar início da geração
    await pipelineLogger.logTilesGenerationStarted(
      template.id,
      template.tiles.length
    );

    // Não bloquear a resposta. Gerar em segundo plano.
    (async () => {
      try {
        console.log(`\n${"=".repeat(80)}`);
        console.log(`🚀 INICIANDO GERAÇÃO EM BACKGROUND - ${company.name}`);
        console.log(`⏰ ${new Date().toISOString()}`);
        console.log(`📊 Tiles a gerar: ${optimizedTiles.length}`);
        console.log(`📋 Template: ${template.id}`);
        console.log(`${"=".repeat(80)}\n`);

        // Callback para salvar cada tile individualmente
        const saveTileCallback = async (tile) => {
          const newTile = {
            id: tile.id,
            title: tile.title,
            question: tile.optimizedPrompt || tile.prompt,
            answer: tile.answer,
            excerpt: tile.excerpt,
            category: tile.category,
            created_at: new Date().toISOString(),
            metrics: tile.metrics,
          };

          await updateCompanyTile(guestId, company.name, newTile);
          console.log(`   ✅ Tile "${tile.title}" salvo no DB imediatamente.`);
        };

        // Gerar todos os tiles com estratégia híbrida
        const results = await generateAllTilesOptimized(
          optimizedTiles,
          tileContext,
          {
            pipelineLogger,
            batchSize: 4, // MUDADO: era 2, agora 4 tiles em paralelo
            onTileCompleted: saveTileCallback, // Callback para salvar imediatamente
            onStream: (tileId, content) => {
              console.log(
                `🌊 Streaming update for tile ${tileId}: ${content.substring(
                  0,
                  50
                )}...`
              );
              // TODO: Implementar WebSocket ou Server-Sent Events para streaming real
            },
          }
        );

        // Limpar lock ao completar (CRÍTICO)
        await db.updateOne(
          "guest_workspaces",
          {
            guest_id: guestId,
            "workspace_data.companies.name": company.name,
          },
          {
            $set: {
              "workspace_data.companies.$.tiles_status": "completed",
              "workspace_data.companies.$.generation_in_progress": false,
              "workspace_data.companies.$.generation_completed_at": new Date(),
              "workspace_data.companies.$.generation_lock_id": null,
            },
          }
        );
        console.log(`✅ Todos os tiles para ${company.name} foram gerados.`);
      } catch (e) {
        console.error(
          "❌ Erro fatal durante a geração de tiles em background:",
          e
        );
        // Marcar como falha e limpar lock
        await db.updateOne(
          "guest_workspaces",
          {
            guest_id: guestId,
            "workspace_data.companies.name": company.name,
          },
          {
            $set: {
              "workspace_data.companies.$.tiles_status": "failed",
              "workspace_data.companies.$.generation_in_progress": false,
              "workspace_data.companies.$.generation_failed_at": new Date(),
              "workspace_data.companies.$.generation_lock_id": null,
            },
          }
        );
      }
    })();

    return NextResponse.json({
      message: "Tile generation started in the background",
      workspace: guestWorkspace,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar tiles:", error);

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    // Marcar como failed
    if (guestId) {
      await db.updateOne(
        "guest_workspaces",
        { guest_id: guestId },
        {
          $set: {
            "workspace_data.companies.0.tiles_status": "failed",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate tiles",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
