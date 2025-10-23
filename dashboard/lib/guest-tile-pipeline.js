/**
 * 🚀 Guest Tile Pipeline
 *
 * Pipeline automático para gerar tiles em guest workspaces
 * Similar ao onboarding pipeline, mas para guest sessions
 */

import { db } from "./db";
import { getGuestTemplate, processPromptVariables } from "./guest-templates";
import { generateTileWithOpenAI } from "./ai-tile-generator";

/**
 * Gera tiles automaticamente para uma company em guest workspace
 *
 * @param {string} guestId - ID da sessão guest
 * @param {string} companyName - Nome da company
 * @param {string} companyUrl - URL da company
 * @param {object} template - Template a ser aplicado (opcional)
 */
export async function generateTilesForCompany(
  guestId,
  companyName,
  companyUrl,
  template = null
) {
  try {
    console.log(
      `🚀 Iniciando geração automática de tiles para: ${companyName}`
    );
    console.log(`🔍 Contexto disponível:`, {
      guestId,
      companyName,
      companyUrl,
    });

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      throw new Error("Guest workspace not found");
    }

    // Marcar como "generating"
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": companyName,
      },
      {
        $set: {
          "workspace_data.companies.$.tiles_status": "generating",
        },
      }
    );

    // Usar template fornecido ou buscar do workspace
    let templateToUse = template;
    if (!templateToUse) {
      templateToUse = getGuestTemplate(
        guestWorkspace.workspace_data.template_id
      );
    }

    // Preparar contexto para geração
    const onboarding = guestWorkspace.workspace_data.onboarding;
    console.log(`🔍 Onboarding data:`, onboarding);

    const context = {
      company: onboarding.salesRepAt || "Unknown Company",
      companyWebsite: onboarding.salesRepWebsite || "", // ⭐ NOVO: Website da empresa do vendedor
      solution: onboarding.sellingSolutionsFor || "Unknown Solution",
      researchTarget: companyName, // ⭐ NOVO: Company sendo pesquisada
      researchWebsite: companyUrl, // ⭐ NOVO: URL da company sendo pesquisada
    };

    console.log(`🔍 Contexto construído:`, context);

    // Processar prompts do template
    const prompts = templateToUse.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: processPromptVariables(tile.prompt, context),
      category: tile.category,
    }));

    console.log(`🤖 Gerando ${prompts.length} tiles para ${companyName}...`);

    // Gerar cada tile
    for (const prompt of prompts) {
      console.log(`   - Gerando tile: ${prompt.title}`);

      const { answer, excerpt } = await generateTileWithOpenAI(
        prompt.prompt,
        companyName,
        companyUrl
      );

      const newTile = {
        id: prompt.id,
        title: prompt.title,
        question: prompt.prompt,
        answer: answer,
        excerpt: excerpt,
        category: prompt.category,
        created_at: new Date().toISOString(),
      };

      // Salvar tile no banco
      await db.updateOne(
        "guest_workspaces",
        {
          guest_id: guestId,
          "workspace_data.companies.name": companyName,
        },
        {
          $push: { "workspace_data.companies.$.tiles": newTile },
        }
      );

      console.log(`   ✅ Tile "${prompt.title}" salvo.`);
    }

    // Marcar como completo
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": companyName,
      },
      {
        $set: {
          "workspace_data.companies.$.tiles_status": "completed",
        },
      }
    );

    console.log(
      `✅ Todos os tiles para ${companyName} foram gerados automaticamente!`
    );

    return { success: true, tilesGenerated: prompts.length };
  } catch (error) {
    console.error(`❌ Erro ao gerar tiles para ${companyName}:`, error);

    // Marcar como falha
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": companyName,
      },
      {
        $set: {
          "workspace_data.companies.$.tiles_status": "failed",
        },
      }
    );

    throw error;
  }
}
