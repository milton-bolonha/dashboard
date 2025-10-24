/**
 * Guest Files API
 * GET: Lista arquivos de uma company
 * POST: Salva arquivo no banco de dados
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";

const fileSchema = Joi.object({
  companyName: Joi.string().required().max(100),
  fileName: Joi.string().required().max(255),
  fileUrl: Joi.string().required().uri(),
  fileType: Joi.string().required().max(50),
  fileSize: Joi.number().required().min(0),
  category: Joi.string()
    .valid("documents", "images", "audio", "video")
    .default("documents"),
}).strict();

/**
 * GET /api/guest/files
 * Lista arquivos de uma company específica
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/files - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const companyName = searchParams.get("companyName");

    console.log("📁 API Files - companyName recebido:", companyName);
    console.log(
      "📁 API Files - searchParams:",
      Object.fromEntries(searchParams.entries())
    );

    if (!companyName) {
      console.log("❌ API Files - companyName é undefined/null");
      return NextResponse.json(
        { success: false, error: "Company name is required" },
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

    // Encontrar a company
    const company = guestWorkspace.workspace_data.companies.find(
      (c) => c.name === companyName
    );

    if (!company) {
      return NextResponse.json(
        { success: false, error: `Company "${companyName}" not found` },
        { status: 404 }
      );
    }

    console.log(
      `📁 Arquivos encontrados para ${companyName}:`,
      company.files?.length || 0
    );

    return NextResponse.json({
      success: true,
      files: company.files || [],
      message: "Files retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao listar arquivos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/files
 * Salva arquivo no banco de dados
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/files - Iniciando...");

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
    const { error, value } = fileSchema.validate(body);
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

    // Encontrar a company
    const companyIndex = guestWorkspace.workspace_data.companies.findIndex(
      (c) => c.name === value.companyName
    );

    if (companyIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Company "${value.companyName}" not found` },
        { status: 404 }
      );
    }

    // Criar objeto do arquivo
    const newFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: value.fileName,
      fileUrl: value.fileUrl,
      fileType: value.fileType,
      fileSize: value.fileSize,
      category: value.category,
      uploadedAt: new Date().toISOString(),
    };

    // Salvar arquivo no banco
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": value.companyName,
      },
      {
        $push: { "workspace_data.companies.$.files": newFile },
        $set: { updatedAt: new Date() },
      }
    );

    console.log(
      `✅ Arquivo salvo para ${value.companyName}:`,
      newFile.fileName
    );

    return NextResponse.json({
      success: true,
      file: newFile,
      message: "File saved successfully",
    });
  } catch (error) {
    console.error("❌ Erro ao salvar arquivo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save file" },
      { status: 500 }
    );
  }
}
