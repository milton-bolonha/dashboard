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
  themeContext = null
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  const fullPrompt = `
    Based on ${companyName}${
    companyUrl ? ` (website: ${companyUrl})` : ""
  }, answer the following question:
    "${prompt}"

    After providing a detailed answer, please provide a concise, one-sentence summary of your answer.
    The summary must be prefixed with "SUMMARY:". For example: "SUMMARY: This is the one-sentence summary."
  `;

  const startTime = Date.now(); // ⭐ Marcar início da geração

  try {
    // Build theme-specific system prompt
    const systemPrompt = buildSystemPrompt(themeContext);

    const completion = await openai.chat.completions.create({
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
      temperature: 0.7,
      max_tokens: 800,
    });

    const endTime = Date.now();
    const generationDuration = endTime - startTime;

    const responseContent = completion.choices[0].message.content;

    // Parse the response to separate the main content from the summary
    const [content, summaryPart] = responseContent.split("SUMMARY:");
    const rawSummary = summaryPart
      ? summaryPart.trim()
      : content.substring(0, 150) + "..."; // Fallback summary

    // Sanitizar respostas para garantir markdown válido
    const sanitizedAnswer = sanitizeHtml(content.trim(), {
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

    const sanitizedExcerpt = sanitizeHtml(rawSummary, {
      allowedTags: [], // Apenas texto
      allowedAttributes: {},
    });

    // ⭐ Estatísticas de geração
    const metrics = {
      generation_duration_ms: generationDuration,
      tokens_used: completion.usage?.total_tokens || 0,
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
      model: "gpt-4-turbo-preview",
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Tile gerado com sucesso!");
    console.log(`⏱️  Duração: ${generationDuration}ms`);
    console.log(`🎯 Tokens usados: ${metrics.tokens_used}`);

    return {
      answer: sanitizedAnswer.trim(),
      excerpt: sanitizedExcerpt.trim(),
      metrics: metrics,
    };
  } catch (error) {
    console.error("❌ Erro ao gerar tile com OpenAI:", error);

    if (error.status === 429) {
      throw new Error(
        "Rate limit reached. Please wait a moment and try again."
      );
    }

    if (error.status === 401) {
      throw new Error(
        "API key invalid. Please check your OPENAI_API_KEY configuration."
      );
    }

    throw new Error(
      `Error generating content: ${error.message}. Please try regenerating this tile.`
    );
  }
}
