import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * POST /api/deploy/webhook
 * Recebe notificações de status da GitHub Action sobre deploys
 */
export async function POST(request) {
  try {
    console.log("[WEBHOOK] Recebendo notificação de deploy...");

    const body = await request.json();
    const { status, run_id, deploy_id, step, message } = body;

    console.log(
      `[WEBHOOK] Deploy ID: ${deploy_id}, Status: ${status}, Step: ${step}`
    );

    if (!deploy_id) {
      console.error("[WEBHOOK] Deploy ID é obrigatório");
      return NextResponse.json(
        { error: "Deploy ID é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o deployment no banco
    console.log(`[WEBHOOK] 🔍 Buscando deployment com ID: ${deploy_id}`);
    const deployment = await db.findOne("deployments", {
      deploymentId: deploy_id,
    });

    if (!deployment) {
      console.error(`[WEBHOOK] ❌ Deployment ${deploy_id} não encontrado`);

      // Debug: Verificar deployments existentes
      const recentDeployments = await db.find(
        "deployments",
        {},
        { sort: { createdAt: -1 }, limit: 5 }
      );
      console.log(
        `[WEBHOOK] 🔍 Últimos 5 deployments:`,
        recentDeployments.map((d) => ({
          id: d.deploymentId,
          created: d.createdAt,
        }))
      );

      return NextResponse.json(
        { error: "Deployment não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar status do deployment
    const updateData = {
      status,
      lastUpdate: new Date(),
    };

    if (message) {
      updateData.message = message;
    }

    if (step) {
      updateData.currentStep = step;
    }

    if (run_id) {
      updateData.githubRunId = run_id;
    }

    // Adicionar informações específicas baseadas no status
    if (status === "concluido") {
      updateData.completedAt = new Date();
      console.log(`[WEBHOOK] ✅ Deploy ${deploy_id} concluído com sucesso!`);
    } else if (status === "falhou") {
      updateData.failedAt = new Date();
      console.log(`[WEBHOOK] ❌ Deploy ${deploy_id} falhou: ${message}`);
    }

    await db.updateOne(
      "deployments",
      { deploymentId: deploy_id },
      { $set: updateData }
    );

    console.log(
      `[WEBHOOK] ✅ Status do deploy ${deploy_id} atualizado para: ${status}`
    );

    return NextResponse.json({
      success: true,
      deploymentId: deploy_id,
      status,
      message: "Status atualizado com sucesso",
    });
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
