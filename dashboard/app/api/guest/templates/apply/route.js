/**
 * Apply Template API
 * POST: Aplica template ao criar nova company
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getGuestTemplate } from "@/lib/guest-templates";
import { generateTilesForCompany } from "@/lib/guest-tile-pipeline";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const applyTemplateSchema = Joi.object({
  templateId: Joi.string().required(),
  companyName: Joi.string().max(100).trim().required(),
  companyUrl: Joi.string().max(200).trim().required(),
}).strict();

/**
 * POST /api/guest/templates/apply
 * Aplica template ao criar nova company
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/templates/apply - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = applyTemplateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      templateId: sanitizeHtml(value.templateId, { allowedTags: [] }),
      companyName: sanitizeHtml(value.companyName, { allowedTags: [] }),
      companyUrl: sanitizeHtml(value.companyUrl, { allowedTags: [] }),
    };

    // Buscar template
    let template;

    if (
      sanitized.templateId === "template_1" ||
      sanitized.templateId === "template_2"
    ) {
      // Template padrão
      template = getGuestTemplate(sanitized.templateId);
      template.id = sanitized.templateId;
      template.isDefault = true;
    } else {
      // Template customizado
      template = await db.findOne("dashboard_templates", {
        id: sanitized.templateId,
        createdBy: guestId,
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
    }

    console.log(
      `🎯 Aplicando template: ${template.name} para company: ${sanitized.companyName}`
    );

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

    // Verificar limite de companies
    if (
      guestWorkspace.usage.companies_count >=
      guestWorkspace.limits.max_companies
    ) {
      return NextResponse.json(
        {
          error: "Company limit reached",
          limit: guestWorkspace.limits.max_companies,
          current: guestWorkspace.usage.companies_count,
        },
        { status: 403 }
      );
    }

    // Criar nova company com template aplicado
    const newCompany = {
      name: sanitized.companyName,
      url: sanitized.companyUrl,
      added_at: new Date(),
      tiles: [],
      tiles_status: "pending",
      tiles_to_generate: template.tiles.length,
      template_applied: {
        templateId: template.id,
        templateName: template.name,
        appliedAt: new Date(),
      },
    };

    // Adicionar company ao workspace
    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { "workspace_data.companies": newCompany },
        $set: {
          "usage.companies_count": guestWorkspace.usage.companies_count + 1,
          "usage.companies_remaining":
            guestWorkspace.limits.max_companies -
            (guestWorkspace.usage.companies_count + 1),
          "usage.last_activity": new Date(),
        },
      }
    );

    console.log(
      `✅ Company "${sanitized.companyName}" criada com template aplicado`
    );

    // Disparar geração automática de tiles baseada no template
    try {
      await generateTilesForCompany(
        guestId,
        sanitized.companyName,
        sanitized.companyUrl,
        template // Passar template para geração
      );
      console.log(`✅ Geração de tiles iniciada para ${sanitized.companyName}`);
    } catch (pipelineError) {
      console.error("⚠️ Erro ao iniciar geração de tiles:", pipelineError);
      // Não falhar a criação da company por causa do pipeline
    }

    return NextResponse.json({
      success: true,
      company: newCompany,
      template: {
        id: template.id,
        name: template.name,
        tilesCount: template.tiles.length,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao aplicar template:", error);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}
