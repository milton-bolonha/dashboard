import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createJob } from "@/lib/db/prompt-jobs";
import { createDynamicWorkspace } from "@/lib/dynamic-workspace";
import { runJobInBackground } from "@/lib/jobs/runner";
import { v4 as uuidv4 } from "uuid";
import Joi from "joi";
import crypto from "crypto";

const requestBodySchema = Joi.object({
  templateId: Joi.string().required(),
  model: Joi.string().optional().default("o4-mini"),
  context: Joi.object({
    themeId: Joi.string().optional(),
    target: Joi.string().required().min(1),
    targetWebsite: Joi.string().uri().optional().allow(""),
    solution: Joi.string().optional().allow(""),
  })
    .required()
    .unknown(true), // unknown(true) permite outros campos no context
});

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Validação Robusta do Input
    const { error, value } = requestBodySchema.validate(body);
    if (error) {
      console.warn(
        "[Create Job Route v2.0] ⚠️ Erro de validação:",
        error.details
      );
      return NextResponse.json(
        { error: "Invalid request body", details: error.details },
        { status: 400 }
      );
    }
    const { templateId, model, context } = value;
    console.log("[Create Job Route v2.0] ✅ Payload validado:", {
      templateId,
      model,
      context,
    });

    // 2. Gerar novos IDs e Token de Acesso
    const guestId = `guest_${uuidv4()}`;
    const jobId = `job_${Date.now().toString(36)}`;
    const accessToken = crypto.randomBytes(24).toString("hex");
    const accessTokenHash = crypto
      .createHash("sha256")
      .update(accessToken)
      .digest("hex");

    // ⭐ FIX: Buscar o tema antes de criar o workspace
    const themeId = context.themeId || "sales-assistant";
    let theme = await db.findOne("themes", { id: themeId });

    // ⭐ FIX: Se o tema não for encontrado, usar o tema padrão como fallback.
    if (!theme) {
      console.warn(
        `[Create Job Route v2.0] ⚠️ Tema '${themeId}' não encontrado. Usando fallback 'sales-assistant'.`
      );
      theme = await db.findOne("themes", { id: "sales-assistant" });
    }

    // ⭐ FIX FINAL: Se nem o fallback for encontrado, usar um tema base do código.
    if (!theme) {
      console.warn(
        `[Create Job Route v2.0] ⚠️ Tema 'sales-assistant' não encontrado no DB. Usando BASE_THEMES.`
      );
      const { BASE_THEMES } = await import("@/lib/base-themes");
      theme = BASE_THEMES.sales;
    }

    if (!theme) {
      // Se nem o tema base funcionar, aí sim é um erro fatal.
      return NextResponse.json(
        { error: `Nenhum tema funcional encontrado.` },
        { status: 500 }
      );
    }

    // 3. Criar o workspace e a company em memória
    console.log(
      "[Create Job Route v2.0] 🏗️  Criando workspace dinâmico com o tema:",
      theme.id
    );
    const { workspaceData, dynamicData, themeSnapshot } =
      await createDynamicWorkspace(theme, context);

    // 4. Salvar o Guest Workspace completo no DB
    const newWorkspace = {
      guest_id: guestId,
      themeId: themeSnapshot.id,
      themeSnapshot: themeSnapshot,
      dynamicData: dynamicData,
      workspace_data: workspaceData,
      context: context,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insertOne("guest_workspaces", newWorkspace);
    console.log(
      `[Create Job Route v2.0] ✅ Workspace salvo para guestId: ${guestId}`
    );

    // Constrói um contexto enriquecido para o job, incluindo dados da entidade criada
    const jobContext = {
      ...context,
      company: {
        name: dynamicData.companies[0]?.name || context.target,
        website: dynamicData.companies[0]?.website || context.targetWebsite,
      },
      // Futuramente, pode incluir outras entidades como 'book', 'project', etc.
    };

    // 5. Criar o Job no Banco de Dados
    const totals = { items: themeSnapshot.tileTemplates?.length || 8 };

    await createJob({
      jobId,
      templateId,
      model,
      dataSource: { type: "context", data: jobContext }, // ⭐ USA O CONTEXTO ENRIQUECIDO
      status: "QUEUED",
      totals,
      guestId,
      accessTokenHash, // Salvar o hash no job
    });
    console.log(`[Create Job Route v2.0] ✅ Job criado: ${jobId}`);

    // 6. Disparar a geração de tiles em background (não esperar a conclusão)
    runJobInBackground(jobId);
    console.log(
      `[Create Job Route v2.0] 🚀 Geração de tiles iniciada em background para o job ${jobId}`
    );

    // 7. Retornar IDs e o token de acesso para o frontend redirecionar
    return NextResponse.json(
      { jobId, guestId, token: accessToken },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Create Job Route v2.0] ❌ Erro inesperado na rota:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
