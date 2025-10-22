/**
 * Guest Workspace API
 * POST: Criar novo guest workspace
 * GET: Buscar guest workspace existente
 *
 * Seguindo padrões do projeto:
 * - getCurrentAuth() para auth (guest-auth.js)
 * - lib/db.js para database
 * - Validação Joi + sanitization
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { getGuestTemplate } from "@/lib/guest-templates";
import { generateAllTiles } from "@/lib/ai-tile-generator";
import { checkRateLimit } from "@/lib/simple-rate-limit";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

// Validação de input (seguindo padrão do projeto)
const createWorkspaceSchema = Joi.object({
  template_id: Joi.string().valid("template_1", "template_2").required(),
  context: Joi.object({
    company: Joi.string().max(100).trim().required(),
    companyWebsite: Joi.string().max(200).trim().required(), // ⭐ NOVO: Website da empresa do vendedor
    solution: Joi.string().max(500).trim().required(),
    researchTarget: Joi.string().max(100).trim().required(), // ⭐ NOVO: Nome da empresa a pesquisar
    researchWebsite: Joi.string().max(200).trim().required(), // ⭐ NOVO: Website da empresa a pesquisar
  }).required(),
}).strict();

/**
 * POST /api/guest/workspace
 * Cria novo guest workspace com tiles gerados pela AI
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/workspace - Iniciando...");

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      console.log("❌ Rate limit atingido!");
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }

    const body = await req.json();
    console.log("📦 Body recebido:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = createWorkspaceSchema.validate(body);
    if (error) {
      console.log("❌ Erro de validação:", error.details[0].message);
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }
    console.log("✅ Validação passou!");

    // Sanitizar TODOS os inputs
    const sanitized = {
      template_id: value.template_id,
      context: {
        company: sanitizeHtml(value.context.company, { allowedTags: [] }),
        companyWebsite: sanitizeHtml(value.context.companyWebsite, {
          allowedTags: [],
        }), // ⭐ NOVO
        solution: sanitizeHtml(value.context.solution, { allowedTags: [] }),
        researchTarget: sanitizeHtml(value.context.researchTarget, {
          allowedTags: [],
        }), // ⭐ NOVO
        researchWebsite: sanitizeHtml(value.context.researchWebsite, {
          allowedTags: [],
        }), // ⭐ NOVO
      },
    };
    console.log("✅ Inputs sanitizados!");

    // ⭐ Next.js 15: cookies() precisa await
    console.log("🔍 Verificando cookie existente...");
    const cookieStore = await cookies();
    const existingGuestId = cookieStore.get("guest_id")?.value;
    console.log("🔍 Guest ID do cookie:", existingGuestId);

    if (existingGuestId) {
      console.log("⚠️ Já tem guest_id, verificando no MongoDB...");
      const existing = await db.findOne("guest_workspaces", {
        guest_id: existingGuestId,
      });
      console.log(
        "🔍 Workspace existente no MongoDB:",
        existing ? "SIM" : "NÃO"
      );

      if (existing) {
        console.log("❌ Guest session já existe! Retornando 400 com redirect");
        return NextResponse.json(
          {
            error: "Guest session already exists",
            redirect: "/trial",
          },
          { status: 400 }
        );
      } else {
        console.log("✅ Cookie existe mas workspace não, continuando...");
      }
    } else {
      console.log("✅ Sem cookie existente, criando novo...");
    }

    // Gerar guest_id
    const guestId = uuidv4();

    // Buscar template
    const template = getGuestTemplate(sanitized.template_id);

    console.log(
      `🚀 Criando guest workspace VAZIO para: ${sanitized.context.researchTarget}`
    );

    // ⭐ MUDANÇA: NÃO gerar tiles aqui! Frontend vai gerar depois
    // Criar guest workspace VAZIO no MongoDB
    await db.insertOne("guest_workspaces", {
      guest_id: guestId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias

      workspace_data: {
        name: `${sanitized.context.company} (Trial)`,
        template_id: sanitized.template_id,

        // Contexto do onboarding (para conversão futura)
        onboarding: {
          salesRepAt: sanitized.context.company,
          salesRepWebsite: sanitized.context.companyWebsite, // ⭐ NOVO: Website da empresa do vendedor
          sellingSolutionsFor: sanitized.context.solution,
          researchTarget: sanitized.context.researchTarget, // ⭐ NOVO: Nome da empresa a pesquisar
          targetCompanyUrl: sanitized.context.researchWebsite, // ⭐ NOVO: Website da empresa a pesquisar
        },

        // Empresas pesquisadas
        companies: [
          {
            name: sanitized.context.researchTarget, // ⭐ NOVO: Nome da empresa a pesquisar
            url: sanitized.context.researchWebsite, // ⭐ NOVO: Website da empresa a pesquisar
            added_at: new Date(),
            tiles: [], // ⭐ VAZIO! Frontend vai gerar
            tiles_status: "pending", // ⭐ Status: pending, generating, completed
            tiles_to_generate: template.tiles.length,
          },
        ],

        // Contatos (inicialmente vazio)
        contacts: [],
      },

      usage: {
        companies_count: 1,
        tiles_generated: 0, // ⭐ Ainda zero
        api_calls: 0,
        last_activity: new Date(),
      },

      limits: {
        max_companies: 2,
        companies_remaining: 1,
      },

      ip_address: ip,
    });

    // ⭐ Next.js 15: await cookies()
    const cookieStore2 = await cookies();
    cookieStore2.set("guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    console.log(
      `✅ Guest workspace criado (vazio, tiles serão gerados no frontend)`
    );

    return NextResponse.json({
      success: true,
      guest_id: guestId,
      workspace: {
        name: `${sanitized.context.company} (Trial)`,
        template_id: sanitized.template_id,
        tiles_to_generate: template.tiles.length,
      },
      redirect: "/dashboard/trial",
    });
  } catch (error) {
    console.error("❌ Erro ao criar guest workspace:", error);

    return NextResponse.json(
      {
        error: "Failed to create workspace",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/guest/workspace
 * Busca guest workspace existente
 */
export async function GET() {
  try {
    console.log("📥 GET /api/guest/workspace - Iniciando...");

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    console.log("🔍 Guest ID do cookie:", guestId);

    if (!guestId) {
      console.log("❌ Sem guest_id no cookie");
      return NextResponse.json(
        { error: "No guest session found" },
        { status: 401 }
      );
    }

    const workspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    console.log("📊 Workspace encontrado:", workspace ? "SIM" : "NÃO");
    if (workspace) {
      console.log("📦 Dados do workspace:", JSON.stringify(workspace, null, 2));
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Verificar expiração
    if (new Date() > workspace.expires_at) {
      await db.deleteOne("guest_workspaces", { guest_id: guestId });
      return NextResponse.json(
        { error: "Guest session expired" },
        { status: 410 }
      );
    }

    // Retornar workspace (sem dados sensíveis)
    return NextResponse.json({
      workspace: workspace.workspace_data,
      usage: workspace.usage,
      limits: {
        max_companies: 2,
        companies_remaining: 2 - workspace.usage.companies_count,
      },
      expires_at: workspace.expires_at,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar guest workspace:", error);

    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}
