import { db } from "./db";
import crypto from "crypto";

// Função para gerar um hash seguro de uma chave de API
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Valida uma API key a partir de um request.
 * Segue o padrão "Bearer" no header "Authorization".
 * @param {Request} request O objeto de requisição do Next.js.
 * @returns {Promise<{valid: boolean, error?: string, key?: object}>}
 */
async function validateApiKey(request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { valid: false, error: "Authorization header required" };
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return {
      valid: false,
      error: "Invalid Authorization header format. Expected 'Bearer <token>'.",
    };
  }

  try {
    // Fazer o hash do token recebido para comparar com o que está no banco
    const hashedToken = hashApiKey(token);

    // Buscar a chave pelo seu hash
    const key = await db.findOne("apiKeys", {
      hashedKey: hashedToken,
    });

    if (!key) {
      return { valid: false, error: "Invalid API key" };
    }

    // Opcional: Adicionar verificação de expiração ou status 'isActive' aqui
    // if (!key.isActive || (key.expiresAt && new Date() > key.expiresAt)) {
    //   return { valid: false, error: "API key is inactive or expired" };
    // }

    return { valid: true, key };
  } catch (error) {
    console.error("Erro ao validar API key:", error);
    return { valid: false, error: "Internal server error" };
  }
}

/**
 * Middleware para rotas que requerem API key.
 * Um wrapper simples em torno de validateApiKey para padronizar a resposta.
 */
export async function requireApiKey(request) {
  const validation = await validateApiKey(request);

  if (!validation.valid) {
    return {
      error: validation.error,
      status: 401, // Unauthorized
    };
  }

  // TODO: Implementar Rate Limiting futuramente

  return { key: validation.key };
}
