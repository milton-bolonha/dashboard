/**
 * Guest Workspace API
 * GET: Busca configurações do workspace
 * POST: Cria novo guest workspace (onboarding)
 * PUT: Atualiza configurações do workspace (background, etc.)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";

const workspaceCreateSchema = Joi.object({
  template_id: Joi.string().required(),
  context: Joi.object().required(),
}).strict();

const workspaceUpdateSchema = Joi.object({
  dashboardBackground: Joi.object({
    type: Joi.string().valid("solid", "image").required(),
    value: Joi.string().required(),
  }).optional(),
}).strict();

/**
 * GET /api/guest/workspace
 * Busca configurações do workspace
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    console.log("✅ Workspace encontrado");

    return NextResponse.json({
      success: true,
      workspace: guestWorkspace.workspace_data,
      message: "Workspace retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao buscar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve workspace" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/workspace
 * Cria novo guest workspace (onboarding)
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = workspaceCreateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Verificar se workspace já existe
    const existingWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (existingWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace already exists" },
        { status: 409 }
      );
    }

    // Criar company baseada no contexto
    const companyName = value.context.researchTarget || "Target Company";
    const company = {
      id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: companyName,
      website: value.context.researchWebsite || "",
      industry: "Unknown",
      description: `Research target: ${companyName}`,
      tiles: [],
      contacts: [],
      notes: [],
      files: [],
      tiles_status: "pending", // ⭐ CRÍTICO: Marcar para geração automática
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Criar novo workspace
    const newWorkspace = {
      guest_id: guestId,
      workspace_data: {
        name: value.context.company || "My Workspace", // FIX: Add workspace name
        companies: [company],
        tiles: [],
        templates: [],
        dashboardBackground: null,
      },
      template_id: value.template_id,
      context: value.context,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insertOne("guest_workspaces", newWorkspace);

    console.log("✅ Guest workspace criado:", guestId);

    return NextResponse.json({
      success: true,
      workspace: newWorkspace.workspace_data,
      message: "Guest workspace created successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao criar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/guest/workspace
 * Atualiza configurações do workspace
 */
export async function PUT(req) {
  try {
    console.log("📥 PUT /api/guest/workspace - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = workspaceUpdateSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Atualizar workspace
    const updateData = {
      updatedAt: new Date(),
    };

    if (value.dashboardBackground) {
      updateData["workspace_data.dashboardBackground"] =
        value.dashboardBackground;
    }

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      { $set: updateData }
    );

    console.log("✅ Workspace atualizado:", updateData);

    return NextResponse.json({
      success: true,
      message: "Workspace updated successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
