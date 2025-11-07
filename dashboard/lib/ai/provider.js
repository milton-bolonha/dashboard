// Provider de IA REAL com OpenAI streaming
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const OPENAI_REQUEST_TIMEOUT_MS = Math.max(
  0,
  parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS || "10000", 10)
);

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

      const startTime = Date.now();

      if (isGpt5Family) {
        const responseParams = {
          model,
          input: prompt,
          max_output_tokens: max_tokens,
        };

        const reasoningMap = {
          minimal: "low",
          low: "low",
          normal: "medium",
          medium: "medium",
          advanced: "high",
          high: "high",
        };

        if (reasoningEffort) {
          const normalizedEffort = reasoningMap[reasoningEffort] || null;
          if (normalizedEffort) {
            responseParams.reasoning = { effort: normalizedEffort };
          } else {
            console.warn(
              `[OpenAI Provider] ⚠️ Ignorando reasoningEffort inválido: '${reasoningEffort}' (esperado: minimal, low, medium, high)`
            );
          }
        }

        if (verbosity) {
          const verbosityMap = {
            concise: "low",
            low: "low",
            normal: "medium",
            medium: "medium",
            detailed: "high",
            high: "high",
          };
          const normalizedVerbosity = verbosityMap[verbosity] || null;
          if (normalizedVerbosity) {
            responseParams.text = { verbosity: normalizedVerbosity };
          } else {
            console.warn(
              `[OpenAI Provider] ⚠️ Ignorando verbosity inválido: '${verbosity}' (esperado: low, medium, high)`
            );
          }
        }

        const controller = new AbortController();
        let timeoutId = null;
        if (OPENAI_REQUEST_TIMEOUT_MS > 0) {
          timeoutId = setTimeout(() => {
            console.warn(
              `[OpenAI Provider] ⏱️ Abortando chamada Responses após ${OPENAI_REQUEST_TIMEOUT_MS}ms`
            );
            controller.abort();
          }, OPENAI_REQUEST_TIMEOUT_MS);
        }

        let response;
        try {
          response = await openai.responses.create(responseParams, {
            signal: controller.signal,
          });
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          throw error;
        }

        if (timeoutId) clearTimeout(timeoutId);

        const totalTime = Date.now() - startTime;

        const outputTextArray = Array.isArray(response.output_text)
          ? response.output_text
          : response.output_text
          ? [response.output_text]
          : [];

        let messageContent = outputTextArray.join("\n").trim();

        if (!messageContent && Array.isArray(response.output)) {
          const aggregated = response.output
            .map((item) => {
              if (!item) return "";
              if (item.type === "message" && Array.isArray(item.content)) {
                return item.content
                  .map((part) => {
                    if (!part) return "";
                    if (typeof part.text === "string") return part.text;
                    if (Array.isArray(part.text)) return part.text.join("");
                    if (typeof part.content === "string") return part.content;
                    if (Array.isArray(part.content))
                      return part.content.join("");
                    if (typeof part.output_text === "string")
                      return part.output_text;
                    if (Array.isArray(part.output_text))
                      return part.output_text.join("");
                    return "";
                  })
                  .join("");
              }
              if (typeof item.output_text === "string") return item.output_text;
              if (Array.isArray(item.output_text))
                return item.output_text.join("");
              return "";
            })
            .filter(Boolean)
            .join("\n");

          messageContent = aggregated.trim();
        }

        if (!messageContent) {
          console.warn(
            "[OpenAI Provider] ⚠️ Responses API retornou sem output_text utilizável",
            {
              responseKeys: Object.keys(response || {}),
            }
          );
        }

        const usage = response?.usage
          ? {
              prompt_tokens: response.usage.input_token_count ?? null,
              completion_tokens: response.usage.output_token_count ?? null,
              total_tokens: response.usage.total_token_count ?? null,
            }
          : null;

        console.log(
          `[OpenAI Provider] ✅ Completo (Responses): ${
            usage?.total_tokens ?? "?"
          } tokens em ${totalTime}ms`
        );

        return {
          content: messageContent,
          usage,
          totalDurationMs: totalTime,
        };
      }

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
      } else {
        completionParams.max_tokens = max_tokens;
        completionParams.temperature = temperature;
      }

      if (reasoningEffort) {
        const chatReasoningMap = {
          low: "low",
          medium: "medium",
          high: "high",
        };
        const normalizedEffort = chatReasoningMap[reasoningEffort];
        if (normalizedEffort) {
          completionParams.reasoning = { effort: normalizedEffort };
        } else {
          console.warn(
            `[OpenAI Provider] ⚠️ Ignorando reasoningEffort inválido para chat completions: '${reasoningEffort}'`
          );
        }
      }

      if (verbosity) {
        const chatVerbosityMap = {
          low: "low",
          medium: "medium",
          high: "high",
        };
        const normalizedVerbosity = chatVerbosityMap[verbosity];
        if (normalizedVerbosity) {
          completionParams.verbosity = normalizedVerbosity;
        } else {
          console.warn(
            `[OpenAI Provider] ⚠️ Ignorando verbosity inválido para chat completions: '${verbosity}'`
          );
        }
      }

      const controller = new AbortController();
      let timeoutId = null;
      if (OPENAI_REQUEST_TIMEOUT_MS > 0) {
        timeoutId = setTimeout(() => {
          console.warn(
            `[OpenAI Provider] ⏱️ Abortando chamada Chat após ${OPENAI_REQUEST_TIMEOUT_MS}ms`
          );
          controller.abort();
        }, OPENAI_REQUEST_TIMEOUT_MS);
      }

      let completion;
      try {
        completion = await openai.chat.completions.create(completionParams, {
          signal: controller.signal,
        });
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

      if (timeoutId) clearTimeout(timeoutId);

      const totalTime = Date.now() - startTime;

      const choice = completion.choices?.[0] ?? {};
      const message = choice.message ?? {};

      function extractText(value) {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value);
        }
        if (Array.isArray(value)) {
          return value
            .map((item) => extractText(item))
            .filter(Boolean)
            .join("");
        }
        if (typeof value === "object") {
          if (typeof value.output_text !== "undefined") {
            return extractText(value.output_text);
          }
          if (typeof value.text !== "undefined") {
            return extractText(value.text);
          }
          if (typeof value.content !== "undefined") {
            return extractText(value.content);
          }
          if (typeof value.value !== "undefined") {
            return extractText(value.value);
          }
          if (typeof value.parts !== "undefined") {
            return extractText(value.parts);
          }
          if (typeof value.messages !== "undefined") {
            return extractText(value.messages);
          }
          if (typeof value.choices !== "undefined") {
            return extractText(value.choices);
          }
        }
        return "";
      }

      let messageContent = extractText(message.content);

      if (!messageContent) {
        messageContent = extractText(choice.content);
      }

      messageContent = (messageContent ?? "").trim();

      if (!messageContent) {
        console.warn(
          "[OpenAI Provider] ⚠️ Completion retornou sem conteúdo textual. verifying choice structure...",
          {
            choiceKeys: Object.keys(choice || {}),
            messageKeys: Object.keys(message || {}),
            rawMessagePreview: (() => {
              try {
                const serialized = JSON.stringify(message, null, 2);
                return serialized.length > 800
                  ? `${serialized.slice(0, 800)}…`
                  : serialized;
              } catch (serializationError) {
                return `<<erro ao serializar mensagem: ${serializationError}>>`;
              }
            })(),
          }
        );
      }

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
