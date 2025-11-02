import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/db/prompt-jobs";
import { queueJob } from "@/lib/jobs/deck-engine-adapter";
import { getCurrentAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { jobId } = await params;

    // ⭐ DEBUG: Log da requisição recebida
    console.log("[Run Route] 📥 ========== NOVA REQUISIÇÃO ==========");
    console.log("[Run Route] 📥 JobId recebido:", jobId);

    // ⭐ CORREÇÃO: Tratar body vazio ou inválido
    let body = {};
    try {
      const bodyText = await request.text();
      if (bodyText && bodyText.trim().length > 0) {
        body = JSON.parse(bodyText);
        console.log("[Run Route] 📥 Body recebido:", {
          hasGuestId: !!body.guestId,
          scope: body.scope,
          itemsCount: Array.isArray(body.items) ? body.items.length : 0,
          hasToken: !!body.token,
        });
        console.log(
          "[Run Route] 📥 Body completo:",
          JSON.stringify(body, null, 2)
        );
      } else {
        console.warn(
          "[Run Route] ⚠️ Body vazio ou ausente - usando valores padrão"
        );
        body = {}; // Usar objeto vazio com valores padrão
      }
    } catch (parseError) {
      console.error("[Run Route] ❌ Erro ao parsear body:", parseError);
      console.error(
        "[Run Route] ❌ Body text (primeiros 200 chars):",
        typeof bodyText !== "undefined"
          ? bodyText.substring(0, 200)
          : "undefined"
      );
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { guestId, scope = "admin", items = [], token } = body;

    // ⭐ Buscar job
    const job = await getJob(jobId);
    if (!job) {
      console.error("[Run Route] ❌ Job não encontrado:", jobId);
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.log("[Run Route] ✅ Job encontrado:", {
      jobId: job.jobId,
      templateId: job.templateId,
      model: job.model,
      status: job.status,
    });

    // ⭐ Se não for fluxo guest, exigir usuário logado e ownership do job
    if (!guestId) {
      try {
        const { userId } = await getCurrentAuth();
        if (!userId) {
          console.error("[Run Route] ❌ Usuário não autenticado");
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        if (job.ownerId && job.ownerId !== userId) {
          console.error("[Run Route] ❌ Usuário não tem permissão:", {
            ownerId: job.ownerId,
            userId,
          });
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
      } catch (authError) {
        console.error("[Run Route] ❌ Erro na autenticação:", authError);
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    // ⭐ Processar items
    const safeItems = Array.isArray(items)
      ? items.map((it, i) => ({
          ...it,
          orderIndex: typeof it?.orderIndex === "number" ? it.orderIndex : i,
        }))
      : [];

    console.log("[Run Route] 📋 ========== ITEMS PROCESSADOS ==========");
    console.log("[Run Route] 📋 Total de items:", safeItems.length);

    if (safeItems.length > 0) {
      const firstItem = safeItems[0];
      console.log("[Run Route] 📋 Primeiro item completo:", firstItem);
      console.log(
        "[Run Route] 📋 Campos do primeiro item:",
        Object.keys(firstItem)
      );
      console.log(
        "[Run Route] 📋 Valores do primeiro item (JSON):",
        JSON.stringify(firstItem, null, 2)
      );

      // Verificar campos críticos
      const criticalFields = [
        "researchTarget",
        "company",
        "name",
        "solution",
        "researchWebsite",
        "companyWebsite",
      ];
      const missingFields = criticalFields.filter(
        (field) => !firstItem[field] || firstItem[field] === ""
      );
      if (missingFields.length > 0) {
        console.warn(
          "[Run Route] ⚠️ Campos faltando no primeiro item:",
          missingFields
        );
        console.warn(
          "[Run Route] ⚠️ Campos presentes:",
          Object.keys(firstItem)
        );
      } else {
        console.log("[Run Route] ✅ Todos os campos críticos presentes!");
      }
    } else {
      console.error("[Run Route] ❌ Items array está VAZIO!");
    }
    console.log("[Run Route] 📋 ======================================");

    // ⭐ Salvar initialItems no job para acesso posterior
    try {
      // ⭐ CORREÇÃO: Garantir que initialItems seja salvo corretamente
      const updateData = {
        status: "QUEUED",
        initialItems: safeItems, // Salvar items iniciais para referência
      };

      console.log("[Run Route] 💾 Salvando initialItems:", {
        jobId,
        itemsCount: safeItems.length,
        firstItemKeys: safeItems[0] ? Object.keys(safeItems[0]) : [],
        firstItemResearchTarget: safeItems[0]?.researchTarget || "N/A",
        firstItemCompany: safeItems[0]?.company || "N/A",
      });

      await updateJob(jobId, updateData);

      // ⭐ VERIFICAÇÃO: Buscar job novamente para confirmar que foi salvo
      const updatedJob = await getJob(jobId);
      if (updatedJob?.initialItems) {
        console.log("[Run Route] ✅ initialItems confirmado salvo:", {
          itemsCount: updatedJob.initialItems.length,
          firstItemKeys: updatedJob.initialItems[0]
            ? Object.keys(updatedJob.initialItems[0])
            : [],
        });
      } else {
        console.warn("[Run Route] ⚠️ initialItems NÃO encontrado após salvar!");
      }

      console.log("[Run Route] ✅ Job atualizado para QUEUED com initialItems");
    } catch (updateError) {
      console.error("[Run Route] ❌ Erro ao atualizar job:", updateError);
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 }
      );
    }

    // ⭐ Iniciar queueJob
    console.log("[Run Route] 🚀 Chamando queueJob...");
    try {
      await queueJob({
        guestId,
        jobId,
        templateId: job.templateId,
        model: job.model,
        items: safeItems,
        scope,
        token,
      });
      console.log("[Run Route] ✅ queueJob concluído com sucesso");
    } catch (queueError) {
      console.error("[Run Route] ❌ Erro ao executar queueJob:", queueError);
      // Não falhar aqui - job já foi atualizado
      // Retornar sucesso parcial
    }

    console.log("[Run Route] ✅ ========== REQUISIÇÃO FINALIZADA ==========");
    return NextResponse.json({ ok: true, status: "QUEUED" });
  } catch (error) {
    console.error("[Run Route] ❌ Erro não tratado:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
