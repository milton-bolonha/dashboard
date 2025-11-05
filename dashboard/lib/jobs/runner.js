import { db } from "@/lib/db";
import { getJob, updateJob } from "@/lib/db/prompt-jobs";
import { queueJob } from "@/lib/jobs/deck-engine-adapter";
import { emitJobEvent } from "@/lib/jobs/events";

/**
 * Inicia a execução de um job em background.
 * Esta função não bloqueia e não deve ser aguardada (await).
 * @param {string} jobId - O ID do job a ser executado.
 */
export function runJobInBackground(jobId) {
  // Envolve a lógica em uma função auto-executável para não bloquear a thread principal
  (async () => {
    let job = null;
    try {
      console.log(`[Runner] 🚀 Iniciando job ${jobId} em background...`);
      console.log(`[Runner] 📍 Stack trace:`, new Error().stack);

      job = await getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} não encontrado no banco de dados.`);
      }

      console.log(`[Runner] ✅ Job encontrado:`, {
        jobId: job.jobId,
        guestId: job.guestId,
        templateId: job.templateId,
        status: job.status,
        hasDataSource: !!job.dataSource,
      });

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

      console.log(`[Runner] 📋 Preparando queueJob:`, {
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
      });

      console.log(`[Runner] ✅ Job ${jobId} enfileirado com sucesso.`);
    } catch (error) {
      console.error(
        `[Runner] ❌ Erro fatal ao executar job ${jobId} em background:`,
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
          `[Runner] 📣 Evento SSE 'job:status' com FAILED emitido para ${jobId}.`
        );
      }

      try {
        // Tenta marcar o job como FAILED para que a UI possa reagir
        await updateJob(jobId, { status: "FAILED", error: error.message });
      } catch (updateError) {
        console.error(
          `[Runner] ❌ Erro ao atualizar status do job ${jobId} para FAILED:`,
          updateError
        );
      }
    }
  })();
}
