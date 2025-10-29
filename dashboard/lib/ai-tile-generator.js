/**
 * AI Tile Generator
 * Gera conteúdo de tiles usando OpenAI API
 *
 * Env var necessária: OPENAI_API_KEY
 */

import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";
import { processPromptVariables } from "./guest-templates";

// Inicializar OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera conteúdo de um único tile usando OpenAI
 *
 * @param {string} tilePrompt - Prompt do tile (com variáveis)
 * @param {object} context - Contexto do onboarding
 * @returns {Promise<string>} - Resposta da OpenAI
 */
export async function generateTileContent(tilePrompt, context) {
  // Processar variáveis: {target_company} → "Tesla"
  const processedPrompt = processPromptVariables(tilePrompt, context);

  console.log("🤖 Gerando tile com OpenAI:", processedPrompt.substring(0, 100));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert sales research assistant helping sales professionals.

Context about the sales rep:
- Works at: ${context.company} (${context.companyWebsite})
- Sells: ${context.solution}
- Researching: ${context.researchTarget} (${context.researchWebsite})

Provide detailed, actionable insights focused on sales opportunities.
Format your answers in clear, well-structured markdown.
Be specific and data-driven when possible.`,
        },
        {
          role: "user",
          content: processedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const answer = completion.choices[0].message.content;

    console.log(
      "✅ Tile gerado com sucesso!",
      answer.substring(0, 100) + "..."
    );

    return answer;
  } catch (error) {
    console.error("❌ Erro ao gerar tile com OpenAI:", error);

    // Fallback para erro (não quebrar a experiência)
    if (error.status === 429) {
      return "⚠️ Rate limit reached. Please wait a moment and try again.";
    }

    if (error.status === 401) {
      return "⚠️ API key invalid. Please check your OPENAI_API_KEY configuration.";
    }

    return `⚠️ Error generating content: ${error.message}. Please try regenerating this tile.`;
  }
}

/**
 * Gera TODOS os tiles de um template automaticamente
 *
 * @param {object} template - Template selecionado
 * @param {object} context - Contexto do onboarding
 * @param {string} companyName - Nome da empresa sendo pesquisada
 * @returns {Promise<Array>} - Array de tiles com respostas
 */
export async function generateAllTiles(template, context, companyName) {
  console.log(
    `🚀 Gerando ${template.tiles.length} tiles para ${companyName}...`
  );

  const results = [];

  for (const tile of template.tiles) {
    console.log(
      `  📝 Tile ${tile.order}/${template.tiles.length}: ${tile.title}`
    );

    const answer = await generateTileContent(tile.prompt, context);

    results.push({
      id: tile.id,
      title: tile.title,
      question: processPromptVariables(tile.prompt, context),
      answer: answer,
      category: tile.category,
      order: tile.order,
      defaultSize: tile.defaultSize,
      generatedAt: new Date(),
    });

    // Delay para evitar rate limiting da OpenAI
    // OpenAI: 60 requests/min = 1 request/segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("✅ Todos os tiles gerados com sucesso!");

  return results;
}

/**
 * Regenera um tile específico (quando user clica "regenerate")
 */
export async function regenerateTile(tileId, tilePrompt, context) {
  console.log(`🔄 Regenerando tile: ${tileId}`);

  return await generateTileContent(tilePrompt, context);
}

/**
 * Builds a theme-specific system prompt for OpenAI
 * @param {object} themeContext - Context about the theme and entity
 * @returns {string} - System prompt
 */
function buildSystemPrompt(themeContext) {
  if (!themeContext) {
    // Fallback para Sales (compatibilidade)
    return `You are an expert sales research assistant helping sales professionals. Provide detailed, actionable insights focused on sales opportunities.`;
  }

  switch (themeContext.themeId) {
    case "sales-assistant":
      return `You are an expert sales research assistant helping sales professionals.

Context about the sales rep:
- Works at: ${themeContext.primaryEntity?.company || "A sales organization"}
- Sells: ${themeContext.primaryEntity?.solution || "Solutions"}

Provide detailed, actionable insights focused on sales opportunities.
Format your answers in clear, well-structured markdown.
Be specific and data-driven when possible.`;

    case "book-creator":
      return `You are a creative writing AI assistant specialized in book creation and storytelling.

You help authors create compelling narratives, develop characters, and craft engaging plots.

Focus on:
- Creative storytelling elements
- Character development and motivation
- Plot structure and narrative flow
- Engaging and immersive writing

Format your answers in clear, well-structured markdown.`;

    case "construction-manager":
      return `You are a construction management AI assistant helping project managers and site supervisors.

You provide insights on:
- Equipment management and maintenance
- Worker coordination and safety
- Project timeline and logistics
- Documentation and reporting

Format your answers in clear, well-structured markdown.`;

    default:
      return `You are a helpful AI assistant for ${
        themeContext.themeName || "workspace management"
      }.

Provide detailed, actionable information that is relevant to the user's context.
Format your answers in clear, well-structured markdown.`;
  }
}

// This function now returns both the full answer and a summary.
export async function generateTileWithOpenAI(
  prompt,
  companyName,
  companyUrl,
  themeContext = null,
  options = {}
) {
  // ⭐ VALIDATION: Validar API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  // ⭐ VALIDATION: Validar parâmetros de entrada
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt inválido ou vazio");
  }

  // ⭐ OPTIONS: Processar opções com validação
  let { maxTokens = 800, temperature = 0.7, title = "Tile" } = options;

  if (maxTokens < 50 || maxTokens > 4000) {
    console.warn(
      `⚠️ maxTokens (${maxTokens}) fora do range recomendado (50-4000), ajustando para 800`
    );
    maxTokens = Math.max(50, Math.min(4000, maxTokens));
  }

  if (temperature < 0 || temperature > 2) {
    console.warn(
      `⚠️ temperature (${temperature}) fora do range (0-2), ajustando para 0.7`
    );
    temperature = Math.max(0, Math.min(2, temperature));
  }

  // ⭐ PROMPT CONSTRUCTION: Construir prompt completo com validação
  let fullPrompt;
  try {
    const cleanCompanyName =
      companyName && typeof companyName === "string" ? companyName.trim() : "";
    const cleanCompanyUrl =
      companyUrl && typeof companyUrl === "string" ? companyUrl.trim() : "";

    fullPrompt = `Based on ${cleanCompanyName || "the provided information"}${
      cleanCompanyUrl ? ` (website: ${cleanCompanyUrl})` : ""
    }, answer the following question:
    "${prompt.trim()}"

    After providing a detailed answer, please provide a concise, one-sentence summary of your answer.
    The summary must be prefixed with "SUMMARY:". For example: "SUMMARY: This is the one-sentence summary."`;

    // ⭐ EDGE CASE: Verificar tamanho do prompt
    if (fullPrompt.length > 8000) {
      console.warn("⚠️ Prompt muito longo, truncando para 8000 caracteres");
      fullPrompt = fullPrompt.substring(0, 8000) + "...";
    }
  } catch (promptError) {
    console.error("❌ Erro ao construir prompt:", promptError);
    throw new Error("Erro ao processar prompt");
  }

  const startTime = Date.now();

  try {
    // ⭐ SYSTEM PROMPT: Construir system prompt baseado no tema com fallback
    let systemPrompt;
    try {
      systemPrompt = buildSystemPrompt(themeContext);
    } catch (systemError) {
      console.warn(
        "⚠️ Erro ao construir system prompt, usando fallback:",
        systemError.message
      );
      systemPrompt =
        "Você é um assistente de IA especializado em análise e geração de conteúdo. Responda de forma clara, concisa e útil.";
    }

    console.log("🤖 Enviando para OpenAI...");
    console.log("📝 System prompt:", systemPrompt.substring(0, 100) + "...");
    console.log("📝 User prompt:", fullPrompt.substring(0, 100) + "...");
    console.log("⚙️ Configurações:", {
      maxTokens,
      temperature,
      model: "gpt-4-turbo-preview",
    });

    // ⭐ OPENAI CALL: Chamada com timeout
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      }),
      // ⭐ TIMEOUT: 30 segundos de timeout
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI timeout após 30s")), 30000)
      ),
    ]);

    const endTime = Date.now();
    const generationDuration = endTime - startTime;

    // ⭐ RESPONSE VALIDATION: Validar resposta da OpenAI
    if (
      !completion ||
      !completion.choices ||
      !Array.isArray(completion.choices)
    ) {
      throw new Error("Resposta inválida da OpenAI");
    }

    const firstChoice = completion.choices[0];
    if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
      throw new Error("Conteúdo da resposta não encontrado");
    }

    const responseContent = firstChoice.message.content;
    if (!responseContent || typeof responseContent !== "string") {
      throw new Error("Conteúdo da resposta inválido");
    }

    // ⭐ CONTENT PARSING: Separar conteúdo principal do resumo com error handling
    let content, rawSummary;
    try {
      const [mainContent, summaryPart] = responseContent.split("SUMMARY:");
      content = mainContent ? mainContent.trim() : responseContent;
      rawSummary = summaryPart
        ? summaryPart.trim()
        : content.substring(0, 150) + "...";
    } catch (parseError) {
      console.warn(
        "⚠️ Erro ao parsear resposta, usando conteúdo completo:",
        parseError.message
      );
      content = responseContent;
      rawSummary = responseContent.substring(0, 150) + "...";
    }

    // ⭐ SANITIZATION: Sanitizar respostas com error handling
    let sanitizedAnswer, sanitizedExcerpt;

    try {
      sanitizedAnswer = sanitizeHtml(content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "pre",
          "code",
        ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          code: ["class"],
          pre: ["class"],
        },
      });

      sanitizedExcerpt = sanitizeHtml(rawSummary, {
        allowedTags: [], // Apenas texto
        allowedAttributes: {},
      });
    } catch (sanitizeError) {
      console.warn(
        "⚠️ Erro na sanitização, usando conteúdo original:",
        sanitizeError.message
      );
      sanitizedAnswer = content;
      sanitizedExcerpt = rawSummary;
    }

    // ⭐ METRICS: Coletar estatísticas de geração
    const metrics = {
      generation_duration_ms: generationDuration,
      tokens_used: completion.usage?.total_tokens || 0,
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
      model: "gpt-4-turbo-preview",
      timestamp: new Date().toISOString(),
      // ⭐ DEBUG: Adicionar informações de debug
      debug: {
        promptLength: fullPrompt.length,
        systemPromptLength: systemPrompt.length,
        rawResponseLength: responseContent.length,
        sanitizedAnswerLength: sanitizedAnswer.length,
        themeContext: themeContext
          ? {
              themeId: themeContext.themeId,
              themeName: themeContext.themeName,
            }
          : null,
      },
    };

    console.log("✅ Tile gerado com sucesso!");
    console.log(`⏱️  Duração: ${generationDuration}ms`);
    console.log(
      `🎯 Tokens usados: ${metrics.tokens_used} (prompt: ${metrics.prompt_tokens}, completion: ${metrics.completion_tokens})`
    );

    return {
      title: title,
      answer: sanitizedAnswer.trim(),
      excerpt: sanitizedExcerpt.trim(),
      question: prompt,
      metrics: metrics,
    };
  } catch (error) {
    const endTime = Date.now();
    const generationDuration = endTime - startTime;

    // ⭐ ERROR CLASSIFICATION: Classificar tipos de erro
    let errorType = "unknown";
    let userMessage =
      "Desculpe, não foi possível gerar uma resposta no momento. Tente novamente.";

    if (error.message.includes("timeout")) {
      errorType = "timeout";
      userMessage = "A geração demorou muito para responder. Tente novamente.";
    } else if (error.status === 429 || error.message.includes("rate limit")) {
      errorType = "rate_limit";
      userMessage =
        "Muitas requisições simultâneas. Aguarde um momento e tente novamente.";
    } else if (error.status === 401 || error.message.includes("API key")) {
      errorType = "invalid_api_key";
      userMessage = "Configuração de API inválida. Verifique as configurações.";
    } else if (
      error.status === 402 ||
      error.message.includes("quota") ||
      error.message.includes("billing")
    ) {
      errorType = "quota_exceeded";
      userMessage = "Limite de uso atingido. Tente novamente mais tarde.";
    } else if (error.status === 400 || error.message.includes("invalid")) {
      errorType = "invalid_request";
      userMessage =
        "Solicitação inválida. Verifique os dados e tente novamente.";
    }

    console.error(`❌ Erro na geração com OpenAI (${errorType}):`, error);
    console.error("⏱️ Duração até erro:", generationDuration + "ms");
    console.error(
      "📝 Prompt que causou erro:",
      prompt.substring(0, 100) + "..."
    );

    // ⭐ FALLBACK RESPONSE: Retornar resposta de fallback com contexto
    return {
      title: title,
      answer: userMessage,
      excerpt: `Erro: ${errorType}`,
      question: prompt,
      metrics: {
        generation_duration_ms: generationDuration,
        error: error.message,
        errorType: errorType,
        timestamp: new Date().toISOString(),
        // ⭐ DEBUG: Adicionar contexto do erro
        debug: {
          promptLength: prompt?.length || 0,
          companyName: companyName || null,
          companyUrl: companyUrl || null,
          themeContext: themeContext
            ? {
                themeId: themeContext.themeId,
                themeName: themeContext.themeName,
              }
            : null,
        },
      },
    };
  }
}
