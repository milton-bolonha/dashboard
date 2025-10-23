/**
 * Guest Files API
 * GET: Lista arquivos de uma company
 * POST: Upload de arquivo
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  uploadFile,
  listFiles,
  generateFolderPath,
  validateFileType,
} from "@/lib/cloudinary";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const uploadFileSchema = Joi.object({
  companyId: Joi.string().required(),
  fileName: Joi.string().max(200).trim().required(),
  fileData: Joi.string().required(), // Base64
  mimeType: Joi.string().required(),
  category: Joi.string()
    .valid("documents", "images", "archives")
    .default("documents"),
}).strict();

/**
 * GET /api/guest/files?companyId=xxx
 * Lista arquivos de uma company específica
 */
export async function GET(req) {
  try {
    console.log("📥 GET /api/guest/files - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const category = searchParams.get("category") || "documents";

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
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

    // Buscar company específica
    const company = guestWorkspace.workspace_data.companies.find(
      (c) => c.name === companyId || c.id === companyId
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Listar arquivos do Cloudinary
    const folderPath = generateFolderPath(guestId, company.name, category);
    const cloudinaryResult = await listFiles(folderPath);

    if (!cloudinaryResult.success) {
      return NextResponse.json(
        { error: "Failed to list files" },
        { status: 500 }
      );
    }

    console.log(
      `✅ ${cloudinaryResult.files.length} arquivos encontrados para ${company.name}`
    );

    return NextResponse.json({
      success: true,
      files: cloudinaryResult.files,
      company: {
        id: company.name,
        name: company.name,
      },
      category,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar arquivos:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/files
 * Upload de arquivo para uma company
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/files - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log(
      "📦 Body:",
      JSON.stringify({ ...body, fileData: "[BASE64_DATA]" }, null, 2)
    );

    // Validar input
    const { error, value } = uploadFileSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      companyId: sanitizeHtml(value.companyId, { allowedTags: [] }),
      fileName: sanitizeHtml(value.fileName, { allowedTags: [] }),
      fileData: value.fileData,
      mimeType: sanitizeHtml(value.mimeType, { allowedTags: [] }),
      category: sanitizeHtml(value.category, { allowedTags: [] }),
    };

    // Validar tipo de arquivo
    const fileValidation = validateFileType(
      sanitized.fileName,
      sanitized.mimeType
    );
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
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

    // Buscar company específica
    const company = guestWorkspace.workspace_data.companies.find(
      (c) => c.name === sanitized.companyId || c.id === sanitized.companyId
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Converter base64 para buffer
    const fileBuffer = Buffer.from(sanitized.fileData, "base64");

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = sanitized.fileName.substring(
      sanitized.fileName.lastIndexOf(".")
    );
    const uniqueFileName = `${sanitized.fileName.replace(
      fileExtension,
      ""
    )}_${timestamp}${fileExtension}`;

    // Upload para Cloudinary
    const folderPath = generateFolderPath(
      guestId,
      company.name,
      sanitized.category
    );
    const uploadResult = await uploadFile(
      fileBuffer,
      uniqueFileName,
      folderPath
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload file" },
        { status: 500 }
      );
    }

    // Salvar referência do arquivo no banco
    const fileRecord = {
      id: uploadResult.file.id,
      fileName: sanitized.fileName,
      originalName: sanitized.fileName,
      cloudinaryId: uploadResult.file.publicId,
      url: uploadResult.file.url,
      size: uploadResult.file.size,
      format: uploadResult.file.format,
      category: sanitized.category,
      type: fileValidation.type,
      uploadedAt: new Date(),
    };

    // Adicionar arquivo à company
    const companyIndex = guestWorkspace.workspace_data.companies.findIndex(
      (c) => c.name === sanitized.companyId || c.id === sanitized.companyId
    );

    await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $push: {
          [`workspace_data.companies.${companyIndex}.files`]: fileRecord,
        },
        $set: {
          "usage.last_activity": new Date(),
        },
      }
    );

    console.log(
      `✅ Arquivo uploadado: ${sanitized.fileName} para ${sanitized.companyId}`
    );

    return NextResponse.json({
      success: true,
      file: fileRecord,
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
