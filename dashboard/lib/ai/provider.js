// Provider de IA REAL com OpenAI streaming
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera uma completion única (sem streaming) usando OpenAI
 */
export async function generateCompletion({
  model = "gpt-5-mini",
  prompt,
  maxAttempts = 3,
  temperature = 0.7,
  max_tokens = 600,
  reasoningEffort,
  verbosity,
}) {
  let attempt = 0;
  let lastError = null;

  console.log(
    "[OpenAI Provider] 🚀 ========== INICIANDO CHAMADA OPENAI =========="
  );
  console.log("[OpenAI Provider] 📝 Model:", model);
  console.log(
    "[OpenAI Provider] 📝 Prompt (primeiros 200 chars):",
    prompt?.substring(0, 200) + "..."
  );
  console.log("[OpenAI Provider] ⚙️ Config:", {
    temperature,
    max_tokens,
    reasoningEffort,
    verbosity,
  });

  while (attempt < maxAttempts) {
    try {
      if (attempt === 0) {
        console.log(
          `[OpenAI Provider] 🔄 Tentativa ${attempt + 1}/${maxAttempts}`
        );
      }

      const lowerModel = model?.toLowerCase?.() || "";
      const isO4Mini =
        lowerModel.includes("o4-mini") || lowerModel.includes("gpt-4o-mini");
      const isGpt5Family = lowerModel.startsWith("gpt-5");

      const completionParams = {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant that provides detailed, accurate, and concise information.",
          },
          { role: "user", content: prompt },
        ],
      };

      if (isO4Mini) {
        completionParams.max_completion_tokens = max_tokens;
      } else if (isGpt5Family) {
        completionParams.max_completion_tokens = max_tokens;
      } else {
        completionParams.max_tokens = max_tokens;
        completionParams.temperature = temperature;
      }

      const supportsReasoningParams = !isGpt5Family;
      if (!supportsReasoningParams && (reasoningEffort || verbosity)) {
        console.warn(
          "[OpenAI Provider] ⚠️ Ignorando parâmetros reasoning/verbosity para modelos GPT-5 via Chat Completions."
        );
      }
      if (supportsReasoningParams && reasoningEffort) {
        completionParams.reasoning = { effort: reasoningEffort };
      }

      if (supportsReasoningParams && verbosity) {
        completionParams.verbosity = verbosity;
      }

      const startTime = Date.now();
      const completion = await openai.chat.completions.create(completionParams);
      const totalTime = Date.now() - startTime;

      const messageContent = completion.choices?.[0]?.message?.content ?? "";
      const usage = completion.usage ?? null;

      console.log(
        `[OpenAI Provider] ✅ Completo: ${
          usage?.total_tokens ?? "?"
        } tokens em ${totalTime}ms`
      );

      return {
        content: messageContent,
        usage,
        totalDurationMs: totalTime,
      };
    } catch (error) {
      attempt += 1;
      lastError = error;
      console.error(`[OpenAI Provider] ❌ Erro na tentativa ${attempt}:`, {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      if (attempt >= maxAttempts) {
        console.error("[OpenAI Provider] ❌ Todas as tentativas falharam!");
        throw error;
      }

      const base = Math.pow(2, attempt) * 250;
      const jitter = Math.floor(Math.random() * 200);
      const delay = base + jitter;
      if (attempt === 1) {
        console.log(`[OpenAI Provider] ⏳ Retry em ${delay}ms`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error("OpenAI completion failed");
}
