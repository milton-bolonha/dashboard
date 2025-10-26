/**
 * Add Company API
 * POST: Adicionar nova empresa ao guest workspace
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const addCompanySchema = Joi.object({
  companyName: Joi.string().max(100).trim().required(),
  companyUrl: Joi.string()
    .max(200)
    .trim()
    .required()
    .custom((value, helpers) => {
      // Aceita URLs simples como "site.com" ou "www.site.com"
      let url = value.trim();

      // Se não começar com http/https/www, adicionar https://
      if (!url.match(/^(https?:\/\/|www\.)/)) {
        url = `https://${url}`;
      } else if (url.startsWith("www.")) {
        url = `https://${url}`;
      }

      // Validar se é uma URL válida
      try {
        new URL(url);
        return url; // Retorna a URL completa
      } catch (err) {
        return helpers.error("any.invalid");
      }
    })
    .messages({
      "any.invalid":
        "Please enter a valid website (e.g., site.com or www.site.com)",
    }),
  researcherUrl: Joi.string()
    .max(200)
    .trim()
    .optional()
    .allow("")
    .custom((value, helpers) => {
      if (!value || value.trim() === "") {
        return value; // Campo opcional
      }

      let url = value.trim();

      // Se não começar com http/https/www, adicionar https://
      if (!url.match(/^(https?:\/\/|www\.)/)) {
        url = `https://${url}`;
      } else if (url.startsWith("www.")) {
        url = `https://${url}`;
      }

      // Validar se é uma URL válida
      try {
        new URL(url);
        return url;
      } catch (err) {
        return helpers.error("any.invalid");
      }
    })
    .messages({
      "any.invalid":
        "Please enter a valid website (e.g., site.com or www.site.com)",
    }),
}).strict();

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/add-company - Iniciando...");

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { error: "No guest session found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = addCompanySchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs (companyUrl já foi validada e tem https://)
    const sanitized = {
      companyName: sanitizeHtml(value.companyName, { allowedTags: [] }),
      companyUrl: value.companyUrl, // Já validada e com https://
      researcherUrl: value.researcherUrl
        ? sanitizeHtml(value.researcherUrl, { allowedTags: [] })
        : "",
    };

    // Buscar workspace
    const workspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Verificar limite
    if (workspace.usage.companies_count >= workspace.limits.max_companies) {
      return NextResponse.json(
        {
          error: "Company limit reached",
          limit: workspace.limits.max_companies,
          current: workspace.usage.companies_count,
        },
        { status: 403 }
      );
    }

    // Buscar template para definir tiles_to_generate
    const { getGuestTemplate } = await import("@/lib/guest-templates");
    const template = getGuestTemplate(workspace.workspace_data.template_id);

    // Adicionar nova company
    const newCompany = {
      name: sanitized.companyName,
      url: sanitized.companyUrl,
      added_at: new Date(),
      tiles: [],
      tiles_status: "pending",
      tiles_to_generate: template.tiles.length, // Usar template correto
    };

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: { "workspace_data.companies": newCompany },
        $set: {
          "usage.companies_count": workspace.usage.companies_count + 1,
          "usage.companies_remaining":
            workspace.limits.max_companies -
            (workspace.usage.companies_count + 1),
          "usage.last_activity": new Date(),
        },
      }
    );

    console.log(
      `✅ Company "${sanitized.companyName}" adicionada ao workspace!`
    );

    // ⭐ NOVO: Disparar geração automática via background function
    console.log(
      `🔥 Disparando geração de tiles via background function para "${sanitized.companyName}"...`
    );

    try {
      const netlifyUrl =
        process.env.NETLIFY_URL || "https://dashboardsalesapp.netlify.app";
      const functionUrl = `${netlifyUrl}/.netlify/functions/generate-tiles`;

      console.log(`📞 Chamando background function: ${functionUrl}`);

      // Fire-and-forget: não esperar resposta
      fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          companyName: sanitized.companyName,
          companyUrl: sanitized.companyUrl,
        }),
      }).catch((error) => {
        console.error(`⚠️ Erro ao chamar background function:`, error.message);
        // Não propagar erro - company já foi criada
      });

      console.log(`✅ Background function chamada (fire-and-forget)`);
    } catch (error) {
      console.error("⚠️ ERRO ao chamar background function:", error);
      // Não falhar a criação da company
    }

    return NextResponse.json({
      success: true,
      company: newCompany,
      usage: {
        companies_count: workspace.usage.companies_count + 1,
        companies_remaining:
          workspace.limits.max_companies -
          (workspace.usage.companies_count + 1),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao adicionar company:", error);
    return NextResponse.json(
      { error: "Failed to add company" },
      { status: 500 }
    );
  }
}
