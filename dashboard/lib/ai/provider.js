// Provider de IA REAL com OpenAI streaming
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera completion streamed do OpenAI
 * ⭐ IMPLEMENTAÇÃO REAL - não é mais placeholder!
 */
export async function* generateStreamedCompletion({
  model = "gpt-4o-mini",
  prompt,
  maxAttempts = 3,
  temperature = 0.7,
  max_tokens = 600,
}) {
  let attempt = 0;

  console.log(
    "[OpenAI Provider] 🚀 ========== INICIANDO CHAMADA OPENAI =========="
  );
  console.log("[OpenAI Provider] 📝 Model:", model);
  console.log(
    "[OpenAI Provider] 📝 Prompt (primeiros 200 chars):",
    prompt?.substring(0, 200) + "..."
  );
  // ⭐ CORREÇÃO: Detectar modelo para usar parâmetro correto
  const isO4Mini = model.includes("o4-mini") || model.includes("gpt-4o-mini");
  console.log("[OpenAI Provider] ⚙️ Config:", {
    temperature,
    max_tokens,
    isO4Mini,
    paramToUse: isO4Mini ? "max_completion_tokens" : "max_tokens",
  });

  const startTime = Date.now();
  let firstTokenTime = null;
  let tokenCount = 0;

  while (attempt < maxAttempts) {
    try {
      // Log apenas se for primeira tentativa
      if (attempt === 0) {
        console.log(
          `[OpenAI Provider] 🔄 Tentativa ${attempt + 1}/${maxAttempts}`
        );
      }

      // ⭐ CORREÇÃO: Modelos o4-mini requerem max_completion_tokens em vez de max_tokens
      // ⭐ CORREÇÃO: Modelos o4-mini não suportam temperature customizado, apenas default (1)
      const isO4Mini =
        model.includes("o4-mini") || model.includes("gpt-4o-mini");
      const completionParams = {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant that provides detailed, accurate, and concise information.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true, // ⭐ STREAMING HABILITADO
      };

      // ⭐ Usar parâmetros corretos baseado no modelo
      if (isO4Mini) {
        completionParams.max_completion_tokens = max_tokens;
      } else {
        completionParams.max_tokens = max_tokens;
        completionParams.temperature = temperature;
      }

      const completion = await openai.chat.completions.create(completionParams);

      // Log removido (redundante)

      // ⭐ ITERAR SOBRE OS CHUNKS EM STREAMING
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          // Primeiro token recebido
          if (!firstTokenTime) {
            firstTokenTime = Date.now();
            const ttft = firstTokenTime - startTime;
            // Log apenas TTFT se for > 1s (indicador de problema)
            if (ttft > 1000) {
              console.log(`[OpenAI Provider] ⚡ TTFT: ${ttft}ms (lento)`);
            }
          }

          tokenCount++;

          // Yield do chunk para o caller
          yield content;

          // Log apenas a cada 50 tokens (reduzir spam)
          if (tokenCount % 50 === 0) {
            console.log(`[OpenAI Provider] 📊 Tokens: ${tokenCount}`);
          }
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const ttft = firstTokenTime ? firstTokenTime - startTime : 0;

      // Log resumido apenas (métricas completas só em debug)
      console.log(
        `[OpenAI Provider] ✅ Completo: ${tokenCount} tokens em ${totalTime}ms`
      );

      return; // Sucesso!
    } catch (error) {
      attempt += 1;
      console.error(`[OpenAI Provider] ❌ Erro na tentativa ${attempt}:`, {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      if (attempt >= maxAttempts) {
        console.error("[OpenAI Provider] ❌ Todas as tentativas falharam!");
        throw error;
      }

      // ⭐ BACKOFF EXPONENCIAL
      const base = Math.pow(2, attempt) * 250; // 250ms, 500ms, 1000ms...
      const jitter = Math.floor(Math.random() * 200);
      const delay = base + jitter;
      // Log apenas se for primeira retentativa
      if (attempt === 1) {
        console.log(`[OpenAI Provider] ⏳ Retry em ${delay}ms`);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
