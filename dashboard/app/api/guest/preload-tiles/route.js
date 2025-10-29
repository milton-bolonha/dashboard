import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTileWithOpenAI } from "@/lib/ai-tile-generator";
import { createTileDebugLogger } from "@/lib/tile-debug-logger";

/**
 * API Route: POST /api/guest/preload-tiles
 *
 * Gera 2 tiles rápidos (What They Do + Revenue Generation) para preload
 * - max_tokens: 150 (respostas curtas)
 * - temperature: 0.5 (mais determinística)
 * - Sem referência cruzada entre tiles
 * - Não bloqueia o fluxo principal
 */
export async function POST(request) {
  const startTime = Date.now(); // ⭐ TIMING: Marcar início do preload

  try {
    const { guestId, tilesCount = 2 } = await request.json();

    if (!guestId) {
      return NextResponse.json(
        { error: "guestId is required" },
        { status: 400 }
      );
    }

    console.log("🚀 PRELOAD: Iniciando preload de tiles...", {
      guestId,
      tilesCount,
    });

    // Buscar workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      console.log("❌ PRELOAD: Workspace não encontrado");
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    const { themeSnapshot, dynamicData } = guestWorkspace;

    // ⭐ DEBUG: Inicializar logger após obter themeSnapshot
    const debugLogger = createTileDebugLogger(guestId, themeSnapshot?.id);
    debugLogger.preloadStarted(tilesCount);

    if (!themeSnapshot || !dynamicData) {
      console.log("❌ PRELOAD: Theme ou dynamicData não encontrados");
      return NextResponse.json(
        { error: "Theme data not found" },
        { status: 400 }
      );
    }

    // Determinar entidade primária
    const primaryEntity = themeSnapshot.primaryEntity;
    let entityKey = primaryEntity.id.endsWith("s")
      ? primaryEntity.id
      : `${primaryEntity.id}s`; // companies, books, projects

    // ⭐ CORREÇÃO CRÍTICA: Corrigir companys -> companies
    if (entityKey === "companys") {
      entityKey = "companies";
    }

    // Buscar entidade atual
    const currentEntity = dynamicData[entityKey]?.[0];

    if (!currentEntity) {
      console.log("❌ PRELOAD: Entidade primária não encontrada");
      return NextResponse.json(
        { error: "Primary entity not found" },
        { status: 400 }
      );
    }

    // Verificar se já existem tiles (evitar duplicação)
    const existingTiles = currentEntity.tiles || [];
    if (existingTiles.length >= tilesCount) {
      console.log("✅ PRELOAD: Tiles já existem, pulando preload");
      return NextResponse.json({
        success: true,
        message: "Tiles already exist",
        tilesCount: existingTiles.length,
      });
    }

    // Gerar apenas os 2 primeiros tiles (What They Do + Revenue Generation)
    const preloadTiles = [];

    // Tile 1: What They Do
    if (existingTiles.length < 1) {
      console.log("📋 PRELOAD: Gerando tile 1 - What They Do");

      try {
        const tile1 = await generateTileWithOpenAI(
          `Succinctly describe what ${
            currentEntity.name || currentEntity.title
          } does. Provide a clear, concise overview of their business, products, and services.`,
          currentEntity.name || currentEntity.title,
          currentEntity.website || "",
          {
            themeId: themeSnapshot.id,
            themeName: themeSnapshot.name,
            primaryEntity: primaryEntity,
          },
          {
            maxTokens: 150, // Resposta curta
            temperature: 0.5, // Mais determinística
            title: "What They Do",
          }
        );

        preloadTiles.push(tile1);
        debugLogger.preloadTileGenerated(
          "What They Do",
          Date.now() - startTime
        );
        console.log("✅ PRELOAD: Tile 1 gerado com sucesso");
      } catch (tile1Error) {
        console.error("❌ PRELOAD: Erro ao gerar tile 1:", tile1Error);
        // Continuar com tile 2 mesmo se tile 1 falhar
      }
    }

    // Tile 2: Revenue Generation
    if (existingTiles.length < 2) {
      console.log("📋 PRELOAD: Gerando tile 2 - Revenue Generation");

      try {
        const tile2 = await generateTileWithOpenAI(
          `How does ${
            currentEntity.name || currentEntity.title
          } generate revenue? Explain their business model, revenue streams, and monetization strategies.`,
          currentEntity.name || currentEntity.title,
          currentEntity.website || "",
          {
            themeId: themeSnapshot.id,
            themeName: themeSnapshot.name,
            primaryEntity: primaryEntity,
          },
          {
            maxTokens: 150, // Resposta curta
            temperature: 0.5, // Mais determinística
            title: "Revenue Generation",
          }
        );

        preloadTiles.push(tile2);
        debugLogger.preloadTileGenerated(
          "Revenue Generation",
          Date.now() - startTime
        );
        console.log("✅ PRELOAD: Tile 2 gerado com sucesso");
      } catch (tile2Error) {
        console.error("❌ PRELOAD: Erro ao gerar tile 2:", tile2Error);
        // Continuar mesmo se tile 2 falhar
      }
    }

    // Salvar tiles no banco
    if (preloadTiles.length > 0) {
      console.log(`💾 PRELOAD: Salvando ${preloadTiles.length} tiles no banco`);

      try {
        await db.updateOne(
          "guest_workspaces",
          { guest_id: guestId },
          {
            $push: {
              [`workspace_data.${entityKey}.0.tiles`]: { $each: preloadTiles },
            },
          }
        );

        console.log("✅ PRELOAD: Tiles salvos com sucesso");
      } catch (saveError) {
        console.error("❌ PRELOAD: Erro ao salvar tiles:", saveError);
        // Não falha o fluxo principal, mas loga o erro
      }
    } else {
      console.log("⚠️ PRELOAD: Nenhum tile gerado para salvar");
    }

    const totalDuration = Date.now() - startTime;
    debugLogger.preloadCompleted(preloadTiles.length, totalDuration);

    return NextResponse.json({
      success: true,
      message: `Preload completed: ${preloadTiles.length} tiles generated`,
      tilesCount: preloadTiles.length,
      totalTiles: existingTiles.length + preloadTiles.length,
    });
  } catch (error) {
    console.error("❌ PRELOAD: Erro ao gerar tiles:", error);

    // Não falha o fluxo principal - retorna sucesso mesmo com erro
    return NextResponse.json(
      {
        success: false,
        message: "Preload failed but continuing",
        error: error.message,
      },
      { status: 200 }
    ); // 200 para não quebrar o fluxo
  }
}
