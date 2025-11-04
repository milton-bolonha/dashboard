/**
 * Guest Tiles API
 * POST: Salva tile no workspace (chamado quando tile é gerado via job)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getJob } from "@/lib/db/prompt-jobs";
import Joi from "joi";

// Schema de validação para o tile que será salvo
const tileSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  content: Joi.string().allow(""),
  answer: Joi.string().allow(""),
  excerpt: Joi.string().allow(""),
  orderIndex: Joi.number().required(),
  metrics: Joi.object().optional(),
  createdAt: Joi.date().iso().required(),
  jobId: Joi.string().required(),
});

// Schema para o corpo da requisição
const requestBodySchema = Joi.object({
  // companyName: Joi.string().required(), // REMOVIDO - Será obtido via Job
  tile: tileSchema.required(),
  jobId: Joi.string().required(),
  entityKey: Joi.string().optional(),
  tiles_to_generate: Joi.number().optional(),
});

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId =
      searchParams.get("guest_id") || cookies().get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    // 1. Validação Robusta do Input
    const body = await req.json();
    const { error, value } = requestBodySchema.validate(body);
    if (error) {
      console.warn(
        "⚠️ [POST /api/guest/tiles] Erro de validação:",
        error.details
      );
      return NextResponse.json(
        { error: "Invalid request body", details: error.details },
        { status: 400 }
      );
    }
    const { tile, jobId, entityKey: providedEntityKey } = value;

    // 2. ⭐ MUDANÇA ARQUITETURAL: Obter o nome da empresa a partir do Job
    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found, cannot determine company" },
        { status: 404 }
      );
    }
    // A fonte da verdade para o nome da empresa é o `target` no `dataSource` do job.
    const companyName = job.dataSource?.data?.target;
    if (!companyName) {
      return NextResponse.json(
        { success: false, error: "Company name not found in job data" },
        { status: 404 }
      );
    }

    console.log(
      `✅ [POST /api/guest/tiles] Payload validado para: { guestId: ${guestId}, companyName: ${companyName} (do Job), tileId: ${tile.id} }`
    );

    // TODO: Usar o theme para determinar a chave da entidade (`companies`, `projects`, etc.)
    const entityKey = providedEntityKey || "companies";

    // A lógica original de busca da entidade para atualização.
    // Ela busca pelo `guest_id` e por um elemento no array `workspace_data.companies`
    // que tenha o `name` que acabamos de obter do job.
    const updateQuery = {
      guest_id: guestId,
      [`workspace_data.${entityKey}.name`]: companyName,
    };
    const tileToSave = {
      ...tile,
      jobId: jobId, // Garante que o jobId esteja no objeto do tile
    };

    const updateData = {
      $push: { [`workspace_data.${entityKey}.$.tiles`]: tileToSave },
      $set: { updatedAt: new Date() },
    };

    const result = await db.updateOne(
      "guest_workspaces",
      updateQuery,
      updateData
    );

    if (result.modifiedCount > 0) {
      console.log(
        `✅ Tile "${tileToSave.title}" salvo com sucesso para a empresa "${companyName}"`
      );
      return NextResponse.json({
        success: true,
        message: "Tile saved successfully",
        tile: tileToSave,
      });
    } else {
      console.warn(
        `⚠️ Empresa "${companyName}" (do job ${jobId}) não encontrada no workspace para o guestId "${guestId}". O tile não foi salvo.`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Company not found in workspace, could not save tile",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("❌ [POST /api/guest/tiles] Erro inesperado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save tile due to an unexpected server error",
      },
      { status: 500 }
    );
  }
}
