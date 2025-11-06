/**
 * Netlify Background Function para processar jobs em segundo plano
 *
 * Esta função é invocada de forma assíncrona e pode rodar por até 15 minutos.
 * Ela processa o job completamente, incluindo a geração de tiles via deck-engine.
 *
 * @see https://docs.netlify.com/build/functions/background-functions/
 */

// Log imediato para confirmar que o módulo foi carregado
console.log("[Background Function] 📦 Módulo carregado");

// Importar módulos (static imports - devem funcionar no Netlify)
try {
  console.log("[Background Function] 📥 Importando módulos...");
} catch (e) {
  console.error("[Background Function] ❌ Erro no top-level:", e);
}

import { db, withMongoConnection } from "../../dashboard/lib/db.js";
import { getJob, updateJob } from "../../dashboard/lib/db/prompt-jobs.js";
import { queueJob } from "../../dashboard/lib/jobs/deck-engine-adapter.js";
import { emitJobEvent } from "../../dashboard/lib/jobs/events.js";

console.log("[Background Function] ✅ Imports concluídos");

/**
 * Handler da Background Function
 * Netlify automaticamente invoca esta função de forma assíncrona
 * quando recebe um POST com header X-NF-Background: true
 *
 * IMPORTANTE: Background functions no Netlify recebem Request (Web API) e devem retornar Response ou undefined
 * @see https://docs.netlify.com/build/functions/background-functions/
 */
export default async function handler(request, context) {
  // ⭐ CRÍTICO: Não esperar por conexões abertas (MongoDB, etc.)
  // Isso garante que a função não trave esperando por conexões
  if (
    context &&
    typeof context.callbackWaitsForEmptyEventLoop !== "undefined"
  ) {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log(
      "[Background Function] ✅ callbackWaitsForEmptyEventLoop = false"
    );
  }

  // Log imediato para confirmar que a função foi invocada
  console.log(`[Background Function] 🔔 Handler invocado!`, {
    method: request.method,
    url: request.url,
    hasBody: !!request.body,
    hasContext: !!context,
  });

  // Verificar se os módulos foram importados corretamente
  const modulesOk =
    !!db &&
    !!withMongoConnection &&
    !!getJob &&
    !!updateJob &&
    !!queueJob &&
    !!emitJobEvent;
  if (!modulesOk) {
    console.error(
      "[Background Function] ❌ Módulos não foram importados corretamente!"
    );
    console.error("[Background Function] 📊 Status dos módulos:", {
      db: !!db,
      withMongoConnection: !!withMongoConnection,
      getJob: !!getJob,
      updateJob: !!updateJob,
      queueJob: !!queueJob,
      emitJobEvent: !!emitJobEvent,
    });
    return new Response(
      JSON.stringify({
        error: "Failed to import required modules",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ⭐ CORREÇÃO: Request.body é um ReadableStream, não uma string
  // Precisamos ler o body usando request.json() ou request.text()
  // IMPORTANTE: request.json() só pode ser chamado uma vez - o body é consumido
  let body;
  try {
    // Ler o body como texto primeiro para poder tentar parsear depois
    const text = await request.text();
    console.log(
      `[Background Function] 📦 Body recebido (${text.length} chars):`,
      text.substring(0, 200)
    );

    if (!text || text.trim() === "") {
      body = {};
    } else {
      // Tentar parsear como JSON
      body = JSON.parse(text);
      console.log(`[Background Function] 📦 Body parseado como JSON:`, {
        jobId: body.jobId,
      });
    }
  } catch (error) {
    console.error("[Background Function] ❌ Erro ao parsear body:", error);
    console.error("[Background Function] ❌ Erro detalhado:", {
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", details: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { jobId } = body || {};

  if (!jobId) {
    console.error(
      "[Background Function] ❌ jobId não fornecido no body:",
      body
    );
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(
    `[Background Function] 🚀 Iniciando processamento do job ${jobId}...`
  );

  // Executar em background (não bloquear a resposta)
  // IMPORTANTE: Não usar await aqui - a função deve retornar 202 imediatamente
  // ⭐ CRÍTICO: Garantir que o processamento continue mesmo após retornar 202
  // Usar setImmediate para garantir que o processamento não seja interrompido
  setImmediate(() => {
    processJobInBackground(jobId).catch((error) => {
      console.error(
        `[Background Function] ❌ Erro fatal ao processar job ${jobId}:`,
        error
      );
      console.error(`[Background Function] ❌ Stack trace:`, error.stack);
    });
  });

  console.log(
    `[Background Function] ⚡ Processamento agendado para execução imediata após retorno 202`
  );

  // ⭐ CORREÇÃO: Retornar Response (Web API) em vez de objeto { statusCode, body }
  // Background functions devem retornar Response ou undefined
  console.log(`[Background Function] ✅ Retornando 202 para job ${jobId}`);
  return new Response(
    JSON.stringify({
      message: "Job processing started",
      jobId,
    }),
    {
      status: 202,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Processa o job completamente em background
 */
async function processJobInBackground(jobId) {
  console.log(
    `[Background Function] 📍 processJobInBackground iniciado para ${jobId}`
  );
  let job = null;
  try {
    console.log(`[Background Function] 🔌 Verificando conexão MongoDB...`);
    // Garantir conexão MongoDB antes de começar
    await withMongoConnection(
      async ({ db: mongoDb }) => {
        await mongoDb.admin().ping();
      },
      {
        label: "background-job:prewarm",
        stage: "background-job",
        retries: 3,
        metadata: { jobId },
      }
    );
    console.log(
      `[Background Function] ✅ MongoDB pre-warm concluído - continuando processamento...`
    );

    // ⭐ CRÍTICO: Garantir que o código continue após o pre-warm
    // Adicionar pequeno delay para garantir que logs apareçam
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`[Background Function] 📥 Buscando job ${jobId}...`);
    job = await getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} não encontrado no banco de dados.`);
    }
    console.log(`[Background Function] ✅ Job encontrado:`, {
      jobId: job.jobId,
      guestId: job.guestId,
      templateId: job.templateId,
      status: job.status,
    });

    // No Fluxo 2.0, o workspace já deve existir
    console.log(
      `[Background Function] 📥 Buscando workspace para guest ${job.guestId}...`
    );
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: job.guestId,
    });
    if (!guestWorkspace) {
      throw new Error(`Workspace para guest ${job.guestId} não encontrado.`);
    }
    console.log(`[Background Function] ✅ Workspace encontrado`);

    // Determina a entidade primária (ex: companies, books, projects)
    console.log(`[Background Function] 🔍 Determinando entityKey...`);
    let entityKey = "companies";
    const primaryEntity = guestWorkspace?.themeSnapshot?.entities?.find(
      (entity) => entity.isPrimary
    );
    if (primaryEntity?.id) {
      entityKey = `${primaryEntity.id}s`.replace("companys", "companies");
    }

    const primaryEntityData = Array.isArray(
      guestWorkspace.workspace_data?.[entityKey]
    )
      ? guestWorkspace.workspace_data[entityKey][0]
      : null;

    const companyNameFromWorkspace = primaryEntityData?.name || null;

    // O contexto foi salvo no job como dataSource
    const items = job.dataSource?.data ? [job.dataSource.data] : [];

    console.log(
      `[Background Function] 📝 Atualizando status do job para QUEUED...`
    );
    await updateJob(jobId, { status: "QUEUED", initialItems: items });
    console.log(`[Background Function] ✅ Status atualizado para QUEUED`);

    console.log(
      `[Background Function] 📋 Preparando queueJob para job ${jobId}`,
      {
        guestId: job.guestId,
        templateId: job.templateId,
        model: job.model,
        itemsCount: items.length,
        entityKey,
        companyName:
          companyNameFromWorkspace ||
          job.dataSource?.data?.company?.name ||
          job.dataSource?.data?.target ||
          job.dataSource?.data?.researchTarget ||
          null,
      }
    );

    // Invocar queueJob que processa todos os tiles
    // Nota: token não é necessário porque emitJobEvent no backend não precisa dele
    // ⭐ CRÍTICO: Remover delay desnecessário - background function já garante execução assíncrona
    console.log(`[Background Function] 🚀 Chamando queueJob (sem delay)...`);
    console.log(`[Background Function] 📋 Parâmetros do queueJob:`, {
      guestId: job.guestId,
      jobId,
      templateId: job.templateId,
      model: job.model,
      itemsCount: items.length,
      entityKey,
      companyName:
        companyNameFromWorkspace ||
        job.dataSource?.data?.company?.name ||
        job.dataSource?.data?.target ||
        job.dataSource?.data?.researchTarget ||
        null,
    });

    try {
      const queueJobResult = await queueJob({
        guestId: job.guestId,
        jobId,
        templateId: job.templateId,
        model: job.model,
        items: items,
        scope: "home", // No Fluxo 2.0, a origem é sempre a home
        entityKey,
        companyName:
          companyNameFromWorkspace ||
          job.dataSource?.data?.company?.name ||
          job.dataSource?.data?.target ||
          job.dataSource?.data?.researchTarget ||
          null,
        token: null, // Não necessário no backend, mas passamos null explicitamente
      });

      console.log(
        `[Background Function] ✅ Job ${jobId} processado com sucesso. queueJob concluído.`,
        { result: queueJobResult }
      );
    } catch (queueJobError) {
      console.error(
        `[Background Function] ❌ Erro ao executar queueJob para job ${jobId}:`,
        queueJobError
      );
      console.error(
        `[Background Function] ❌ Stack trace do queueJob:`,
        queueJobError.stack
      );
      throw queueJobError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error(
      `[Background Function] ❌ Erro fatal ao executar job ${jobId}:`,
      error
    );

    // Notificar o frontend sobre a falha imediatamente via SSE
    if (job?.guestId) {
      emitJobEvent({
        guestId: job.guestId,
        jobId,
        type: "job:status",
        payload: {
          jobId,
          status: "FAILED",
          error: error.message,
          progress: { current: 0, total: 0, remaining: 0 },
        },
      });
      console.log(
        `[Background Function] 📣 Evento SSE 'job:status' com FAILED emitido para ${jobId}.`
      );
    }

    try {
      // Tenta marcar o job como FAILED para que a UI possa reagir
      await updateJob(jobId, { status: "FAILED", error: error.message });
    } catch (updateError) {
      console.error(
        `[Background Function] ❌ Erro ao atualizar status do job ${jobId} para FAILED:`,
        updateError
      );
    }
  }
}
