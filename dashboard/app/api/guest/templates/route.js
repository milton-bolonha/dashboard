import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";

const templateSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500),
  tiles: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        prompt: Joi.string().required(),
        category: Joi.string().required(),
        order: Joi.number().required(),
        defaultSize: Joi.object({
          w: Joi.number().required(),
          h: Joi.number().required(),
        }).required(),
      })
    )
    .required(),
  isDefault: Joi.boolean().default(false),
  isCustom: Joi.boolean().default(true),
});

/**
 * GET /api/guest/templates
 * Lista todos os templates disponíveis
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/templates - Iniciando...");

    const cookieStore = await cookies();
    let guestId = cookieStore.get("guest_id")?.value;

    // ⭐ FALLBACK: Se não há cookie, tentar da query string (fluxo job_id)
    if (!guestId) {
      const { searchParams } = new URL(req.url);
      guestId = searchParams.get("guest_id");
      console.log(
        "🔍 guest_id não encontrado no cookie, tentando query string:",
        guestId
      );
    }

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    // Buscar templates padrão
    const defaultTemplates = [
      {
        id: "template_1",
        name: "Essential Research",
        description: "Basic company research with 8 key insights",
        isDefault: true,
        isCustom: false,
        tiles: [
          {
            id: "funding",
            title: "Funding",
            prompt:
              "What is the latest funding information for {{company_name}}?",
            category: "Financial",
            order: 1,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "competitors",
            title: "Competitors",
            prompt: "Who are the main competitors of {{company_name}}?",
            category: "Market",
            order: 2,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "key_events",
            title: "Key Events",
            prompt: "What are the recent key events for {{company_name}}?",
            category: "News",
            order: 3,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "expansion",
            title: "Expansion",
            prompt: "What are the expansion plans for {{company_name}}?",
            category: "Growth",
            order: 4,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "offices",
            title: "Offices",
            prompt: "How many offices does {{company_name}} have worldwide?",
            category: "Operations",
            order: 5,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "revenue",
            title: "Revenue",
            prompt: "What is the revenue model of {{company_name}}?",
            category: "Financial",
            order: 6,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "challenges",
            title: "Challenges",
            prompt: "What are the main challenges {{company_name}} faces?",
            category: "Strategy",
            order: 7,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "goals",
            title: "Goals",
            prompt: "What are the business goals of {{company_name}}?",
            category: "Strategy",
            order: 8,
            defaultSize: { w: 2, h: 1 },
          },
        ],
      },
      {
        id: "template_2",
        name: "Advanced Analysis",
        description: "Comprehensive analysis with 9 detailed insights",
        isDefault: true,
        isCustom: false,
        tiles: [
          {
            id: "funding",
            title: "Funding",
            prompt:
              "What is the latest funding information for {{company_name}}?",
            category: "Financial",
            order: 1,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "competitors",
            title: "Competitors",
            prompt: "Who are the main competitors of {{company_name}}?",
            category: "Market",
            order: 2,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "key_events",
            title: "Key Events",
            prompt: "What are the recent key events for {{company_name}}?",
            category: "News",
            order: 3,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "expansion",
            title: "Expansion",
            prompt: "What are the expansion plans for {{company_name}}?",
            category: "Growth",
            order: 4,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "offices",
            title: "Offices",
            prompt: "How many offices does {{company_name}} have worldwide?",
            category: "Operations",
            order: 5,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "revenue",
            title: "Revenue",
            prompt: "What is the revenue model of {{company_name}}?",
            category: "Financial",
            order: 6,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "challenges",
            title: "Challenges",
            prompt: "What are the main challenges {{company_name}} faces?",
            category: "Strategy",
            order: 7,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "goals",
            title: "Goals",
            prompt: "What are the business goals of {{company_name}}?",
            category: "Strategy",
            order: 8,
            defaultSize: { w: 2, h: 1 },
          },
          {
            id: "technology",
            title: "Technology",
            prompt: "What technology stack does {{company_name}} use?",
            category: "Technical",
            order: 9,
            defaultSize: { w: 2, h: 1 },
          },
        ],
      },
    ];

    // Buscar templates customizados do usuário
    const customTemplates = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    const templates = [
      ...defaultTemplates,
      ...(customTemplates?.custom_templates || []),
    ];

    console.log(`✅ ${templates.length} templates encontrados`);
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("❌ Erro ao listar templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/templates
 * Cria um novo template customizado
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/templates - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📥 Template data:", body);

    // Validar input
    const { error, value } = templateSchema.validate(body);
    if (error) {
      console.error("❌ Erro de validação:", error.details);
      return NextResponse.json(
        { success: false, error: error.details[0].message },
        { status: 400 }
      );
    }

    // Gerar ID único para o template
    const templateId = `template_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const template = {
      id: templateId,
      ...value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Adicionar template customizado ao workspace
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { custom_templates: template },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(`✅ Template criado: ${templateId}`);
    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("❌ Erro ao criar template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}
