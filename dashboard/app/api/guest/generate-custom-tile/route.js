/**
 * Guest Custom Tile Generation API
 * POST: Gera um tile customizado para uma company específica
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
// import { generateTileWithOpenAI } from "@/lib/ai-tile-generator";
// import { generateTileWithMetrics } from "@/lib/ai-tile-generator-optimized";
import { getPrimaryEntityData } from "@/lib/theme-tile-generator";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const customTileSchema = Joi.object({
  companyName: Joi.string().max(100).trim().required(),
  prompt: Joi.string().max(1000).trim().required(),
}).strict();

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/generate-custom-tile - Iniciando...");

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = customTileSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      companyName: sanitizeHtml(value.companyName, { allowedTags: [] }),
      prompt: sanitizeHtml(value.prompt, { allowedTags: [] }),
    };

    // Buscar guest workspace com retry
    let guestWorkspace;
    let retryCount = 0;
    const maxRetries = 3;

    while (!guestWorkspace && retryCount < maxRetries) {
      try {
        guestWorkspace = await db.findOne("guest_workspaces", {
          guest_id: guestId,
        });
        console.log("✅ Guest workspace found");
      } catch (dbError) {
        retryCount++;
        console.error(
          `❌ Database error (attempt ${retryCount}/${maxRetries}):`,
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

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Buscar tema do workspace
    const theme = guestWorkspace.themeSnapshot;
    const primaryEntityData = getPrimaryEntityData(
      theme,
      guestWorkspace.dynamicData
    );

    // Criar contexto do tema para OpenAI
    const themeContext = {
      themeId: theme.id,
      themeName: theme.name,
      primaryEntity: primaryEntityData,
    };

    console.log(`🚀 Gerando tile customizado para: "${sanitized.companyName}"`);

    // Gerar tile via OpenAI com contexto do tema
    const { answer, excerpt } = await generateTileWithOpenAI(
      sanitized.prompt,
      primaryEntityData?.name ||
        primaryEntityData?.title ||
        sanitized.companyName,
      primaryEntityData?.website || "",
      themeContext
    );

    const tile = {
      id: `custom_${Date.now()}`,
      title: "Custom Research",
      prompt: sanitized.prompt,
      category: "custom",
    };

    // Buscar contexto do workspace
    const workspaceContext = guestWorkspace.context || {};

    const tileContext = {
      company: workspaceContext.company || company.name,
      companyWebsite: workspaceContext.companyWebsite || company.url || "",
      solution: workspaceContext.solution || "Unknown Solution",
      researchTarget: company.name,
      researchWebsite: company.url || workspaceContext.researchWebsite || "",
    };

    console.log(`🤖 Chamando generateTileWithMetrics...`);
    const result = await generateTileWithMetrics(tile, tileContext, {
      enableStreaming: false, // Custom tiles não usam streaming
      profile: { name: "CUSTOM", maxTokens: 500, temperature: 0.5 },
    });
    console.log(`✅ generateTileWithMetrics concluído:`, {
      id: result.id,
      title: result.title,
      hasAnswer: !!result.answer,
      hasExcerpt: !!result.excerpt,
    });

    // Criar novo tile com métricas
    const newTile = {
      id: result.id,
      title: result.title,
      question: result.prompt,
      answer: result.answer,
      excerpt: result.excerpt,
      category: result.category,
      created_at: new Date().toISOString(),
      isCustom: true, // Flag para identificar tiles customizados
      metrics: {
        total_duration_ms: result.metrics.generation_duration_ms,
        breakdown: result.metrics.breakdown,
        model: result.metrics.model,
        tokens: result.metrics.tokens,
        optimization_profile: "CUSTOM",
      },
    };

    // Salvar tile na estrutura correta baseada no tema
    const primaryEntity = theme.entities.find((e) => e.isPrimary);
    let entityKey = `${primaryEntity.id}s`; // companies, books, projects

    // ⭐ CORREÇÃO CRÍTICA: Corrigir companys -> companies
    if (entityKey === "companys") {
      entityKey = "companies";
    }

    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        [`workspace_data.${entityKey}.0.name`]: sanitized.companyName,
      },
      {
        $push: { [`workspace_data.${entityKey}.0.tiles`]: newTile },
      }
    );

    console.log(`✅ Tile customizado salvo para ${sanitized.companyName}`);

    return NextResponse.json({
      success: true,
      tile: newTile,
      message: "Custom tile generated successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao gerar tile customizado:", error);
    return NextResponse.json(
      { error: "Failed to generate custom tile" },
      { status: 500 }
    );
  }
}
