/**
 * Guest Custom Tile Generation API
 * POST: Gera um tile customizado para uma company específica
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateTileWithOpenAI } from "@/lib/ai-tile-generator";
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

    // Criar novo tile
    const newTile = {
      id: `custom_${Date.now()}`, // ID único para tile customizado
      title: "Custom Research", // Título padrão
      question: sanitized.prompt,
      answer: answer,
      excerpt: excerpt,
      category: "custom",
      created_at: new Date().toISOString(),
      isCustom: true, // Flag para identificar tiles customizados
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
