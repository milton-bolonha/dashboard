import { NextResponse } from "next/server";
import { createJob } from "@/lib/db/prompt-jobs";
import { getCurrentAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    console.log("[Create Job Route] 📥 ========== NOVA REQUISIÇÃO ==========");

    let body = {};
    try {
      body = await request.json();
      console.log("[Create Job Route] 📥 Body recebido:", {
        hasTemplateId: !!body.templateId,
        model: body.model,
        totals: body.totals,
        hasGuestId: !!body.guestId,
      });
    } catch (parseError) {
      console.error("[Create Job Route] ❌ Erro ao parsear body:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      templateId,
      model = "gpt-4-turbo-preview",
      dataSource = {},
      totals = {},
      guestId,
    } = body;

    if (!templateId) {
      console.error("[Create Job Route] ❌ templateId não fornecido");
      return NextResponse.json(
        { error: "templateId required" },
        { status: 400 }
      );
    }

    // ⭐ Se não for fluxo guest, exigir usuário logado
    let ownerId = null;
    if (!guestId) {
      try {
        const { userId } = await getCurrentAuth();
        if (!userId) {
          console.error("[Create Job Route] ❌ Usuário não autenticado");
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        ownerId = userId;
        console.log("[Create Job Route] ✅ Usuário autenticado:", userId);
      } catch (authError) {
        console.error("[Create Job Route] ❌ Erro na autenticação:", authError);
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    } else {
      console.log("[Create Job Route] ✅ Fluxo guest:", guestId);
    }

    const jobId = `job_${Date.now().toString(36)}`;
    console.log("[Create Job Route] 🆕 Criando job:", {
      jobId,
      templateId,
      model,
      totals,
      guestId,
      ownerId,
    });

    try {
      await createJob({
        jobId,
        templateId,
        model,
        dataSource,
        status: "PENDING",
        totals: { items: Number(totals.items || 0), completed: 0, failed: 0 },
        ...(ownerId ? { ownerId } : {}),
        ...(guestId ? { guestId } : {}), // ⭐ NOVO: Salvar guestId no job
      });
      console.log("[Create Job Route] ✅ Job criado com sucesso:", jobId);
      console.log(
        "[Create Job Route] ✅ ========== REQUISIÇÃO FINALIZADA =========="
      );
      return NextResponse.json({ jobId }, { status: 201 });
    } catch (createError) {
      console.error("[Create Job Route] ❌ Erro ao criar job:", createError);
      return NextResponse.json(
        { error: "Failed to create job" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Create Job Route] ❌ Erro não tratado:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
