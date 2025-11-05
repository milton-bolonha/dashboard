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
 */
export async function handler(event) {
  // Log imediato para confirmar que a função foi invocada
  console.log(`[Background Function] 🔔 Handler invocado!`, {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
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
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to import required modules",
      }),
    };
  }

  // Background functions recebem um evento com body serializado
  let body;
  try {
    body = JSON.parse(event.body || "{}");
    console.log(`[Background Function] 📦 Body parseado:`, {
      jobId: body.jobId,
    });
  } catch (error) {
    console.error("[Background Function] ❌ Erro ao parsear body:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { jobId } = body;

  if (!jobId) {
    console.error(
      "[Background Function] ❌ jobId não fornecido no body:",
      body
    );
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "jobId is required" }),
    };
  }

  console.log(
    `[Background Function] 🚀 Iniciando processamento do job ${jobId}...`
  );

  // Executar em background (não bloquear a resposta)
  // IMPORTANTE: Não usar await aqui - a função deve retornar 202 imediatamente
  processJobInBackground(jobId).catch((error) => {
    console.error(
      `[Background Function] ❌ Erro fatal ao processar job ${jobId}:`,
      error
    );
    console.error(`[Background Function] ❌ Stack trace:`, error.stack);
  });

  // Retornar 202 Accepted imediatamente
  console.log(`[Background Function] ✅ Retornando 202 para job ${jobId}`);
  return {
    statusCode: 202,
    body: JSON.stringify({
      message: "Job processing started",
      jobId,
    }),
  };
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

    job = await getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} não encontrado no banco de dados.`);
    }

    // No Fluxo 2.0, o workspace já deve existir
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: job.guestId,
    });
    if (!guestWorkspace) {
      throw new Error(`Workspace para guest ${job.guestId} não encontrado.`);
    }

    // Determina a entidade primária (ex: companies, books, projects)
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

    await updateJob(jobId, { status: "QUEUED", initialItems: items });

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
    await queueJob({
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
      `[Background Function] ✅ Job ${jobId} processado com sucesso.`
    );
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
