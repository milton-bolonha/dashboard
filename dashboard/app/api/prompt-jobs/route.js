import { NextResponse } from "next/server";
import { db, withMongoConnection } from "@/lib/db";
import { createJob } from "@/lib/db/prompt-jobs";
import { createDynamicWorkspace } from "@/lib/dynamic-workspace";
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

    await withMongoConnection(
      async ({ db: mongoDb }) => {
        await mongoDb.admin().ping();
      },
      {
        label: "create-job:prewarm",
        stage: "create-job",
        retries: 3,
        metadata: { templateId },
      }
    );

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
      console.info(
        `[Create Job Route v2.0] Tema '${themeId}' não encontrado. Usando fallback 'sales-assistant'.`
      );
      theme = await db.findOne("themes", { id: "sales-assistant" });
    }

    // ⭐ FIX FINAL: Se nem o fallback for encontrado, usar um tema base do código.
    if (!theme) {
      console.debug(
        `[Create Job Route v2.0] Tema 'sales-assistant' ausente no DB. Usando BASE_THEMES.`
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

    const normalizedContext = buildNormalizedContext(context, dynamicData);

    // 4. Salvar o Guest Workspace completo no DB
    const newWorkspace = {
      guest_id: guestId,
      themeId: themeSnapshot.id,
      themeSnapshot: themeSnapshot,
      dynamicData: dynamicData,
      workspace_data: workspaceData,
      context: normalizedContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insertOne("guest_workspaces", newWorkspace);
    console.log(
      `[Create Job Route v2.0] ✅ Workspace salvo para guestId: ${guestId}`
    );

    // Constrói um contexto enriquecido para o job, incluindo dados da entidade criada
    const jobContext = {
      ...normalizedContext,
      company: normalizedContext.company,
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

    // 6. Disparar a geração de tiles via Netlify Background Function
    // Background Functions podem rodar por até 15 minutos sem bloquear a requisição
    try {
      // Em produção, usar variável de ambiente; em dev, usar localhost do Netlify Dev
      const netlifyUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_PUBLIC_URL ||
        "http://localhost:8888";

      const backgroundFunctionUrl = `${netlifyUrl}/.netlify/functions/process-job-background`;

      console.log(
        `[Create Job Route v2.0] 🚀 Disparando Netlify Background Function para job ${jobId}...`
      );

      // Fire-and-forget: não esperar resposta (background function retorna 202 imediatamente)
      // IMPORTANTE: Background functions no Netlify são detectadas automaticamente pelo sufixo "-background"
      console.log(
        `[Create Job Route v2.0] 📞 Chamando background function: ${backgroundFunctionUrl}`
      );

      // Tentar chamar background function, mas se não funcionar, usar fallback imediatamente
      // (por enquanto, vamos usar o fallback direto já que background functions podem ter problemas)
      console.log(
        `[Create Job Route v2.0] ⚠️ Background functions podem ter problemas no Netlify. Usando fallback direto...`
      );

      // Por enquanto, usar o método direto que já funciona
      // TODO: Depois que background functions estiverem funcionando, remover este fallback
      const { runJobInBackground } = await import("@/lib/jobs/runner");
      runJobInBackground(jobId);

      // Tentar também chamar a background function (para ver se funciona)
      fetch(backgroundFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })
        .then(async (response) => {
          const text = await response.text().catch(() => "");
          console.log(
            `[Create Job Route v2.0] 📥 Resposta da background function: ${
              response.status
            } - ${text.substring(0, 200)}`
          );
        })
        .catch((error) => {
          console.error(
            `[Create Job Route v2.0] ⚠️ Background function não respondeu (mas fallback já está rodando):`,
            error.message
          );
        });

      console.log(
        `[Create Job Route v2.0] ✅ Job ${jobId} disparado para processamento em background`
      );
    } catch (error) {
      console.error(
        `[Create Job Route v2.0] ❌ Erro ao configurar background function:`,
        error
      );
      // Fallback: executar diretamente
      const { runJobInBackground } = await import("@/lib/jobs/runner");
      runJobInBackground(jobId);
    }

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

function buildNormalizedContext(rawContext = {}, dynamicData = {}) {
  const safeString = (value, fallback = "") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return value?.name || value?.title || value?.value || fallback;
    }
    return String(value);
  };

  const normalized = { ...rawContext };
  const companies = Array.isArray(dynamicData.companies)
    ? dynamicData.companies
    : [];
  const primaryCompany = companies[0] || {};

  const companyName = safeString(
    primaryCompany.name,
    safeString(rawContext.company?.name, rawContext.target || "")
  );
  const companyWebsite = safeString(
    primaryCompany.website,
    safeString(
      rawContext.company?.website,
      rawContext.targetWebsite || rawContext.companyWebsite || ""
    )
  );

  normalized.company = {
    name: companyName,
    website: companyWebsite,
  };

  normalized.companyWebsite = companyWebsite;
  normalized.researchTarget = safeString(
    rawContext.researchTarget,
    companyName
  );
  normalized.researchWebsite = safeString(
    rawContext.researchWebsite,
    companyWebsite
  );
  normalized.sellingSolutionsFor = safeString(
    rawContext.sellingSolutionsFor,
    rawContext.solution || ""
  );
  normalized.salesRepAt = safeString(rawContext.salesRepAt, companyName);

  return normalized;
}
