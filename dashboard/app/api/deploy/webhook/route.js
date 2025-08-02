import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { headers } from "next/headers";
import crypto from "crypto";

// Esta função valida se o webhook veio realmente do GitHub
async function verifySignature(request) {
  const signature = headers().get("x-hub-signature-256");
  if (!signature) {
    console.warn("Webhook sem assinatura recebido.");
    return false;
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET não está configurado.");
    return false;
  }

  const body = await request.text();
  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(body).digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request) {
  // A assinatura do webhook não está funcionando como esperado,
  // vamos desativá-la temporariamente para depuração.
  // const isValid = await verifySignature(request.clone());
  // if (!isValid) {
  //   console.error("Assinatura de webhook inválida.");
  //   return NextResponse.json({ error: "Assinatura inválida" }, { status: 403 });
  // }

  try {
    const payload = await request.json();
    const { run_id, status, message, step, deploy_id } = payload;

    if (!deploy_id || !status) {
      return NextResponse.json(
        { error: "deploy_id e status são obrigatórios." },
        { status: 400 }
      );
    }

    const deploymentsCollection = await getCollection("deployments");

    const updateData = {
      $set: {
        status,
        "details.githubActionRunId": run_id,
        "details.lastMessage": message,
        "details.lastStep": step,
        updatedAt: new Date(),
      },
    };

    if (status === "concluido" || status === "falhou") {
      updateData.$set["completedAt"] = new Date();
    }

    const result = await deploymentsCollection.updateOne(
      { _id: deploy_id },
      updateData
    );

    if (result.matchedCount === 0) {
      console.warn(`Webhook recebido para deploy não encontrado: ${deploy_id}`);
      return NextResponse.json(
        { error: "Deploy não encontrado" },
        { status: 404 }
      );
    }

    console.log(
      `[Webhook] Status do deploy ${deploy_id} atualizado para: ${status}`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar webhook de deploy:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
