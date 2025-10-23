/**
 * Guest Templates API
 * GET: Lista templates disponíveis
 * POST: Cria novo template customizado
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createCustomTemplate } from "@/lib/schemas/templates";
import { getGuestTemplate } from "@/lib/guest-templates";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const createTemplateSchema = Joi.object({
  name: Joi.string().max(100).trim().required(),
  description: Joi.string().max(500).trim().allow(""),
  tiles: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        prompt: Joi.string().required(),
        category: Joi.string().required(),
        order: Joi.number().required(),
        defaultSize: Joi.object({
          w: Joi.number().default(4),
          h: Joi.number().default(2),
        }),
        isCustom: Joi.boolean().default(false),
      })
    )
    .min(1)
    .required(),
}).strict();

/**
 * GET /api/guest/templates
 * Lista todos os templates disponíveis (padrão + customizados)
 */
export async function GET() {
  try {
    console.log("📥 GET /api/guest/templates - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    // Buscar templates padrão (template_1, template_2)
    const defaultTemplates = [
      {
        id: "template_1",
        name: "Essential Research",
        description: "6 tiles essenciais de pesquisa de vendas",
        isDefault: true,
        isCustom: false,
        tiles: getGuestTemplate("template_1").tiles,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      },
      {
        id: "template_2",
        name: "Advanced Analysis",
        description: "9 tiles específicos para análise de vendas",
        isDefault: true,
        isCustom: false,
        tiles: getGuestTemplate("template_2").tiles,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      },
    ];

    // Buscar templates customizados do usuário
    const customTemplates = await db.find("dashboard_templates", {
      createdBy: guestId,
      isCustom: true,
    });

    console.log(
      `✅ Templates encontrados: ${defaultTemplates.length} padrão + ${customTemplates.length} customizados`
    );

    return NextResponse.json({
      success: true,
      templates: [...defaultTemplates, ...customTemplates],
    });
  } catch (error) {
    console.error("❌ Erro ao buscar templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/templates
 * Cria novo template customizado
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/templates - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = createTemplateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      name: sanitizeHtml(value.name, { allowedTags: [] }),
      description: sanitizeHtml(value.description, { allowedTags: [] }),
      tiles: value.tiles.map((tile) => ({
        ...tile,
        title: sanitizeHtml(tile.title, { allowedTags: [] }),
        prompt: sanitizeHtml(tile.prompt, { allowedTags: [] }),
        category: sanitizeHtml(tile.category, { allowedTags: [] }),
      })),
    };

    // Verificar se já existe template com mesmo nome
    const existingTemplate = await db.findOne("dashboard_templates", {
      createdBy: guestId,
      name: sanitized.name,
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 409 }
      );
    }

    // Criar template customizado
    const template = createCustomTemplate(
      sanitized.name,
      sanitized.description,
      sanitized.tiles,
      guestId
    );

    // Salvar no banco
    await db.insertOne("dashboard_templates", template);

    console.log(`✅ Template customizado criado: ${template.name}`);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("❌ Erro ao criar template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
