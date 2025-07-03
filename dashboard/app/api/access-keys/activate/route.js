import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AccessKeys } from "@/lib/access-keys";
import { getCollection } from "@/lib/db";
import bcrypt from "bcryptjs";

async function handleSuperAdminSetup(key, userId) {
  console.log(`[DEBUG] Iniciando setup super admin para userId: ${userId}`);

  try {
    const setupCollection = await getCollection("_internal_setup");
    const setupKeyDoc = await setupCollection.findOne({
      type: "SUPER_ADMIN_SETUP_KEY",
    });

    if (!setupKeyDoc) {
      console.log(`[DEBUG] Nenhuma chave de setup encontrada no banco`);
      return null;
    }

    if (new Date() > setupKeyDoc.expiresAt) {
      console.log(`[DEBUG] Chave de setup expirada: ${setupKeyDoc.expiresAt}`);
      await setupCollection.deleteOne({ _id: setupKeyDoc._id });
      return {
        success: false,
        error: "A chave de configuração de super admin expirou.",
      };
    }

    const isValid = await bcrypt.compare(key, setupKeyDoc.hash);
    console.log(`[DEBUG] Validação da chave: ${isValid}`);

    if (isValid) {
      console.log(`[DEBUG] Atualizando usuário ${userId} para super admin`);

      // Usar fetch para atualizar o usuário via API do Clerk
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: { role: "superadmin" },
        }),
      });

      if (!response.ok) {
        console.log(`[DEBUG] Erro ao atualizar usuário: ${response.status}`);
        const errorText = await response.text();
        console.log(`[DEBUG] Resposta do Clerk: ${errorText}`);
        return {
          success: false,
          error: "Erro ao atualizar permissões do usuário.",
        };
      }

      console.log(`[DEBUG] ✅ Usuário atualizado com sucesso no Clerk`);
      await setupCollection.deleteOne({ _id: setupKeyDoc._id });
      console.log(`[DEBUG] Chave de setup removida após uso`);

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
    console.log(`[DEBUG] Erro no handleSuperAdminSetup:`, error.message);
    return {
      success: false,
      error: "Erro interno ao processar chave de super admin.",
    };
  }
}

// Função para extrair userId do token JWT
function extractUserIdFromJWT(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    console.log(`[DEBUG] Payload do JWT:`, {
      sub: payload.sub,
      iss: payload.iss,
      exp: payload.exp,
    });

    return payload.sub;
  } catch (error) {
    console.log(`[DEBUG] Erro ao decodificar JWT:`, error.message);
    return null;
  }
}

export async function POST(req) {
  const startTime = Date.now();
  console.log(`\n[DEBUG] === INICIANDO REQUISIÇÃO ACTIVATE KEY ===`);

  try {
    // Log detalhado dos headers
    const headers = Object.fromEntries(req.headers.entries());
    console.log(`[DEBUG] Headers recebidos:`, {
      authorization: headers.authorization
        ? `Bearer ${headers.authorization.substring(7, 20)}...`
        : "AUSENTE",
      "content-type": headers["content-type"],
    });

    // Tentativa 1: Usar auth() do Clerk
    console.log(`[DEBUG] Tentando autenticação com auth()...`);
    const authResult = auth();
    console.log(`[DEBUG] Resultado auth():`, {
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasUserId: !!authResult.userId,
    });

    let userId = authResult.userId;

    // Tentativa 2: Se auth() não funcionou, extrair do JWT
    if (!userId) {
      console.log(`[DEBUG] auth() falhou, tentando extração do JWT...`);

      const bearerToken = req.headers.get("Authorization");
      if (!bearerToken) {
        console.log(`[DEBUG] ERRO: Header Authorization não encontrado`);
        return NextResponse.json(
          {
            error: "Unauthorized - Token de autorização necessário",
          },
          { status: 401 }
        );
      }

      const token = bearerToken.replace("Bearer ", "");
      userId = extractUserIdFromJWT(token);
      console.log(`[DEBUG] userId extraído do JWT: ${userId}`);
    }

    // Se ainda não tem userId, retornar erro
    if (!userId) {
      console.log(`[DEBUG] ERRO FINAL: Não foi possível obter userId`);
      return NextResponse.json(
        {
          error: "Unauthorized - Usuário não autenticado",
        },
        { status: 401 }
      );
    }

    console.log(`[DEBUG] ✅ userId confirmado: ${userId}`);

    // Processar o body da requisição
    const body = await req.json();
    console.log(`[DEBUG] Body recebido:`, {
      hasCode: !!body.code,
      codePrefix: body.code?.substring(0, 15),
      workspaceId: body.workspaceId,
    });

    // Verificar se é chave de super admin
    if (body.code?.toLowerCase().startsWith("ds-sa-key")) {
      console.log(`[DEBUG] 🔑 Processando chave de super admin...`);
      // Converter para minúsculas para comparação
      const normalizedKey = body.code.toLowerCase();
      console.log(`[DEBUG] Chave normalizada: ${normalizedKey}`);

      const setupResult = await handleSuperAdminSetup(normalizedKey, userId);
      if (setupResult) {
        console.log(`[DEBUG] ✅ Setup result:`, setupResult);
        return NextResponse.json(setupResult);
      } else {
        console.log(`[DEBUG] ❌ Chave de super admin inválida`);
        return NextResponse.json(
          { error: "Chave de super admin inválida" },
          { status: 400 }
        );
      }
    }

    // Processar outras chaves
    console.log(`[DEBUG] Processando chave de acesso regular...`);
    const accessKeys = new AccessKeys();
    const result = await accessKeys.activateKey(
      body.code,
      userId,
      body.workspaceId
    );

    console.log(`[DEBUG] Resultado final:`, {
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
    console.error(`[DEBUG] ERRO CRÍTICO na ativação da chave:`, {
      message: error.message,
      stack: error.stack?.split("\n")[0],
      elapsed: Date.now() - startTime,
    });

    const errorMessage =
      error.errors?.[0]?.message || error.message || "Ocorreu um erro interno.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
