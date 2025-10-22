/**
 * AI Tile Generator
 * Gera conteúdo de tiles usando OpenAI API
 *
 * Env var necessária: OPENAI_API_KEY
 */

import OpenAI from "openai";
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
- Works at: ${context.company}
- Sells: ${context.solution}
- Researching: ${context.research}

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

// This function now returns both the full answer and a summary.
export async function generateTileWithOpenAI(prompt, companyName, companyUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  const fullPrompt = `
    Based on the company ${companyName} (website: ${companyUrl}), answer the following question:
    "${prompt}"

    After providing a detailed answer, please provide a concise, one-sentence summary of your answer.
    The summary must be prefixed with "SUMMARY:". For example: "SUMMARY: This is the one-sentence summary."
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert sales research assistant helping sales professionals.

Context about the sales rep:
- Works at: Instituto Organizacionista
- Sells: Mentoria
- Researching: ${companyName}

Provide detailed, actionable insights focused on sales opportunities.
Format your answers in clear, well-structured markdown.
Be specific and data-driven when possible.`,
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const responseContent = completion.choices[0].message.content;

    // Parse the response to separate the main content from the summary
    const [content, summaryPart] = responseContent.split("SUMMARY:");
    const summary = summaryPart
      ? summaryPart.trim()
      : content.substring(0, 150) + "..."; // Fallback summary

    console.log("✅ Tile gerado com sucesso!");
    console.log("📝 Summary:", summary.substring(0, 100));

    return {
      answer: content.trim(),
      excerpt: summary,
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
