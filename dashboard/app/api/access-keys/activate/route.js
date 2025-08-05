import { NextResponse } from "next/server";
import { AccessKeys } from "@/lib/access-keys";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getCurrentAuth } from "@/lib/auth";
import { logDebug, logError } from "@/lib/logger";

async function handleSuperAdminSetup(key, userId) {
  logDebug(`Iniciando setup super admin para userId: ${userId}`);

  try {
    const setupCollection = await getCollection("_internal_setup");
    const setupKeyDoc = await setupCollection.findOne({
      type: "SUPER_ADMIN_SETUP_KEY",
    });

    if (!setupKeyDoc) {
      logDebug(`Nenhuma chave de setup encontrada no banco`);
      return null;
    }

    if (new Date() > setupKeyDoc.expiresAt) {
      logDebug(`Chave de setup expirada: ${setupKeyDoc.expiresAt}`);
      await setupCollection.deleteOne({ _id: setupKeyDoc._id });
      return {
        success: false,
        error: "A chave de configuração de super admin expirou.",
      };
    }

    // --- MELHORIA DE SEGURANÇA ---
    // Verificar se a chave foi gerada para este usuário específico
    if (setupKeyDoc.intendedUserId && setupKeyDoc.intendedUserId !== userId) {
      logError(
        `Tentativa de uso indevido da chave de Super Admin. Esperado: ${setupKeyDoc.intendedUserId}, Recebido: ${userId}`
      );
      return {
        success: false,
        error:
          "Esta chave de ativação não foi gerada para o seu usuário. Contate o administrador.",
      };
    }
    // --- FIM DA MELHORIA ---

    const isValid = await bcrypt.compare(key, setupKeyDoc.hash);
    logDebug(`Validação da chave: ${isValid}`);

    if (isValid) {
      logDebug(`Atualizando usuário ${userId} para super admin`);

      // Usar fetch para atualizar o usuário via API do Clerk
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          private_metadata: { role: "superadmin" },
        }),
      });

      if (!response.ok) {
        logDebug(`Erro ao atualizar usuário: ${response.status}`);
        const errorText = await response.text();
        logDebug(`Resposta do Clerk: ${errorText}`);
        return {
          success: false,
          error: "Erro ao atualizar permissões do usuário.",
        };
      }

      logDebug(`✅ Usuário atualizado com sucesso no Clerk`);
      await setupCollection.deleteOne({ _id: setupKeyDoc._id });
      logDebug(`Chave de setup removida após uso`);

      return {
        success: true,
        message:
          "Super Admin ativado! Você agora tem controle total. A página será recarregada.",
        grants: {
          role: "superadmin",
        },
      };
    }

    return null;
  } catch (error) {
    logError(`Erro no handleSuperAdminSetup:`, error.message);
    return {
      success: false,
      error: "Erro interno ao processar chave de super admin.",
    };
  }
}

export async function POST(req) {
  const startTime = Date.now();
  logDebug(`=== INICIANDO REQUISIÇÃO ACTIVATE KEY ===`);

  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    logDebug(`✅ userId confirmado: ${userId}`);

    const body = await req.json();
    const { code, workspaceId } = body;

    // Normalizar a chave para comparação segura
    const normalizedKey = code?.toLowerCase().trim();

    logDebug(`Body recebido:`, {
      hasCode: !!normalizedKey,
      normalizedKey: normalizedKey,
      workspaceId: workspaceId,
    });

    // --- CORREÇÃO: Lógica para Super Admin ---
    // Verifica a chave estática ou o prefixo de chaves dinâmicas
    if (
      normalizedKey === "dev-superadmin-key-12345" ||
      normalizedKey?.startsWith("ds-sa-key-")
    ) {
      logDebug(`🔑 Processando chave de super admin...`);
      const setupResult = await handleSuperAdminSetup(normalizedKey, userId);

      if (setupResult?.success) {
        logDebug(`✅ Setup result:`, setupResult);
        return NextResponse.json(setupResult);
      } else {
        const errorMsg =
          setupResult?.error || "Chave de super admin inválida ou expirada.";
        logDebug(`❌ Falha no setup: ${errorMsg}`);
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    }
    // --- FIM DA CORREÇÃO ---

    // Processar outras chaves
    logDebug(`Processando chave de acesso regular...`);
    // --- CORREÇÃO: Chamar método estático diretamente ---
    const result = await AccessKeys.activateKey(
      normalizedKey,
      userId,
      workspaceId
    );

    logDebug(`Resultado final:`, {
      success: result.success,
      error: result.error,
      elapsed: Date.now() - startTime,
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    logError(`ERRO CRÍTICO na ativação da chave:`, {
      message: error.message,
      stack: error.stack?.split("\n")[0],
      elapsed: Date.now() - startTime,
    });

    const errorMessage =
      error.errors?.[0]?.message || error.message || "Ocorreu um erro interno.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
