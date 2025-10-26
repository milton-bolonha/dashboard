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

    // Testar conexão MongoDB primeiro
    try {
      await db.findOne("guest_workspaces", { guest_id: guestId });
    } catch (dbError) {
      console.error("❌ MongoDB connection failed:", dbError.message);

      if (dbError.message.includes("Server selection timed out")) {
        return NextResponse.json(
          {
            error: "Database connection timeout. Please try again in a moment.",
            type: "database_timeout",
          },
          { status: 503 }
        );
      }

      throw dbError;
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

    // Verificar se tiles já foram gerados
    if (company.tiles_status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Tiles already generated",
        tiles: company.tiles,
      });
    }

    // NOVO: Verificar generation lock com timeout
    if (company.generation_in_progress) {
      const startTime = new Date(company.generation_started_at);
      const elapsed = Date.now() - startTime.getTime();

      if (elapsed < 600000) {
        // 10 minutos
        return NextResponse.json(
          {
            error: "Tiles are already being generated for this company",
            status: "generating",
            elapsed_ms: elapsed,
          },
          { status: 409 }
        );
      }

      console.warn(`Generation lock expired (${elapsed}ms), allowing retry`);
    }

    // Setar lock com ID único
    const lockId = `lock_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    await db.updateOne(
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
      }
    );

    // Buscar template
    const template = getGuestTemplate(
      guestWorkspace.workspace_data.template_id
    );

    // Gerar tiles via OpenAI usando os dados da company específica
    const context = guestWorkspace.context || {};
    const tileContext = {
      company: context.company || "Unknown Company",
      companyWebsite: context.companyWebsite || "",
      solution: context.solution || "Unknown Solution",
      researchTarget: company.name,
      researchWebsite: company.website || context.researchWebsite || "",
    };

    console.log("🔍 Contexto para geração de tiles:");
    console.log("- Empresa do vendedor:", tileContext.company);
    console.log("- Website do vendedor:", tileContext.companyWebsite);
    console.log("- Solução vendida:", tileContext.solution);
    console.log("- Empresa a pesquisar:", tileContext.researchTarget);
    console.log(
      "- Website da empresa pesquisada:",
      tileContext.researchWebsite
    );

    // Processar prompts do template
    const prompts = template.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: processPromptVariables(tile.prompt, tileContext),
      category: tile.category,
    }));

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

    // Preparar tiles com otimização
    const baseTiles = template.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: tile.prompt,
      category: tile.category,
      order: tile.order,
    }));

    // Otimizar tiles
    const optimizedTiles = optimizeTiles(baseTiles, tileContext);

    // Não bloquear a resposta. Gerar em segundo plano.
    (async () => {
      try {
        console.log(
          `🤖 Iniciando geração otimizada de ${optimizedTiles.length} tiles em background para ${company.name}...`
        );

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
