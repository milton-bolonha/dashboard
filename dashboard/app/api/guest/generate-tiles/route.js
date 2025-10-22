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
 * Gera tiles para o guest workspace (chamado pelo frontend APÓS redirect)
 */
export async function POST(req) {
  try {
    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
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

    // Verificar se tiles já foram gerados
    const company = guestWorkspace.workspace_data.companies[0];
    if (company.tiles_status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Tiles already generated",
        tiles: company.tiles,
      });
    }

    // Evitar regeneração simultânea
    if (company.tiles_status === "generating") {
      return NextResponse.json(
        { error: "Tiles are already being generated" },
        { status: 409 }
      );
    }

    // Marcar como "generating"
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $set: {
          "workspace_data.companies.0.tiles_status": "generating",
        },
      }
    );

    console.log(`🚀 Gerando tiles para guest: ${guestId}`);

    // Buscar template
    const template = getGuestTemplate(
      guestWorkspace.workspace_data.template_id
    );

    // Gerar tiles via OpenAI
    const onboarding = guestWorkspace.workspace_data.onboarding;
    const context = {
      company: onboarding.salesRepAt,
      solution: onboarding.sellingSolutionsFor,
      research: onboarding.researchTarget,
      companyUrl: onboarding.targetCompanyUrl,
    };

    // Processar prompts do template
    const prompts = template.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: processPromptVariables(tile.prompt, context),
      category: tile.category,
    }));

    // --- Geração Assíncrona de Tiles ---

    // Não bloquear a resposta. Gerar em segundo plano.
    (async () => {
      try {
        console.log(
          `🤖 Iniciando geração de ${prompts.length} tiles em background para ${company.name}...`
        );

        for (const prompt of prompts) {
          console.log(`   - Gerando tile: ${prompt.title}`);
          const { answer, excerpt } = await generateTileWithOpenAI(
            prompt.prompt,
            company.name,
            company.url
          );

          const newTile = {
            id: prompt.id,
            title: prompt.title,
            question: prompt.prompt,
            answer: answer,
            excerpt: excerpt, // Salvar o excerpt
            category: prompt.category,
            created_at: new Date().toISOString(),
          };

          // Salvar cada tile no banco de dados individualmente
          await updateCompanyTile(guestId, company.name, newTile);
          console.log(`   ✅ Tile "${prompt.title}" salvo no DB.`);
        }

        // Marcar como completo
        await db.updateOne(
          "guest_workspaces",
          { guest_id: guestId },
          { $set: { "workspace_data.companies.$[].tiles_status": "completed" } }
        );
        console.log(`✅ Todos os tiles para ${company.name} foram gerados.`);
      } catch (e) {
        console.error(
          "❌ Erro fatal durante a geração de tiles em background:",
          e
        );
        // Marcar como falha para que o usuário possa tentar novamente
        await db.updateOne(
          "guest_workspaces",
          { guest_id: guestId },
          { $set: { "workspace_data.companies.$[].tiles_status": "failed" } }
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
