import type { Config, Context } from "@netlify/functions";
import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 600);
const TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE ?? 0.7);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateRequestBody {
  companyName?: string;
  companyWebsite?: string;
  solution?: string;
}

interface GeneratedTile {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
}

const TILE_PROMPTS = [
  {
    title: "Resumo",
    template:
      "Em 3 bullets curtos, explique o que {company} faz, quem atende e o que a diferencia.",
  },
  {
    title: "Modelo de receita",
    template:
      "Resuma em 120 palavras como {company} monetiza hoje. Cite streams principais e pontos de atenção.",
  },
  {
    title: "Prioridades",
    template:
      "Liste até 3 prioridades estratégicas recentes de {company}, citando fonte e ano entre parênteses.",
  },
  {
    title: "Desafios",
    template:
      "Aponte até 3 desafios relevantes para {company} em 2025, justificando com tendências ou dados públicos.",
  },
  {
    title: "Benefícios da solução",
    template:
      "Explique em 100 palavras como {solution} ajudaria {company}, conectando com dores mencionadas e resultados concretos.",
  },
  {
    title: "Mapa de decisão",
    template:
      "Quem seria o sponsor ideal em {company}? Traga 2 cargos ou áreas chave.",
  },
  {
    title: "Narrativa de outreach",
    template:
      "Escreva 3 frases de abertura para um email de prospecção focado em {solution}, personalizadas para {company}.",
  },
  {
    title: "CTA sugerido",
    template:
      "Crie uma call-to-action clara convidando {company} para avançar com {solution} em até 45 palavras.",
  },
];

export const config: Config = {
  path: "/.netlify/functions/ai-generate",
  rateLimit: {
    windowLimit: Number(process.env.FUNCTION_RATE_LIMIT ?? 30),
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

function interpolate(template: string, company: string, solution: string) {
  return template
    .replace(/{company}/gi, company)
    .replace(/{solution}/gi, solution);
}

async function generateTile(
  prompt: string,
  title: string,
  orderIndex: number,
  context: Context
) {
  context.log("🧠 Chamando OpenAI para tile", {
    orderIndex,
    title,
    promptPreview: prompt.substring(0, 120),
    model: MODEL,
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });
  const completion = await openai.responses.create({
    model: MODEL,
    input: prompt,
    max_output_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });

  const content = completion.output_text?.trim() || "Sem resposta gerada";

  context.log("✅ Tile gerado", {
    orderIndex,
    title,
    contentPreview: content.substring(0, 160),
  });

  return {
    id: `tile_${orderIndex}_${Date.now().toString(36)}`,
    title,
    content,
    orderIndex,
    createdAt: new Date().toISOString(),
  } satisfies GeneratedTile;
}

export default async function handler(request: Request, context: Context) {
  if (request.method !== "POST") {
    context.log("⚠️ Método não permitido", request.method);
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    context.log("🛠️ Configuração da função", {
      model: MODEL,
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      rateLimit: config.rateLimit,
    });

    const body = (await request.json()) as GenerateRequestBody;
    const companyName = body.companyName?.trim();
    const companyWebsite = body.companyWebsite?.trim();
    const solution = body.solution?.trim() || "Mentorship Career Program";

    context.log("📥 Corpo da requisição recebido", {
      companyName,
      companyWebsite,
      solution,
    });

    if (!companyName || !companyWebsite) {
      context.log("❌ Dados obrigatórios faltando", {
        companyName,
        companyWebsite,
      });
      return Response.json(
        { error: "companyName e companyWebsite são obrigatórios" },
        { status: 400 }
      );
    }

    context.log("🚀 Gerando tiles para", companyName, companyWebsite);

    const prompts = TILE_PROMPTS.map((item) => ({
      ...item,
      prompt: interpolate(item.template, companyName, solution),
    }));

    const tiles: GeneratedTile[] = [];

    for (const [index, item] of prompts.entries()) {
      try {
        context.log("🧩 Iniciando geração do tile", {
          orderIndex: index,
          title: item.title,
        });
        const tile = await generateTile(
          item.prompt,
          item.title,
          index,
          context
        );
        tiles.push(tile);
      } catch (error) {
        context.log("⚠️ Falha ao gerar tile", {
          orderIndex: index,
          title: item.title,
          error,
        });
        tiles.push({
          id: `tile_fallback_${index}_${Date.now().toString(36)}`,
          title: `${item.title} (fallback)`,
          content:
            "⚠️ Não foi possível gerar este insight agora. Tente novamente.",
          orderIndex: index,
          createdAt: new Date().toISOString(),
        });
      }
    }

    context.log("✅ Tiles gerados/com fallback", {
      total: tiles.length,
      fallbackCount: tiles.filter((tile) => tile.title.endsWith("(fallback)"))
        .length,
    });

    return Response.json({ tiles });
  } catch (error) {
    context.log("❌ Erro inesperado", error);
    return Response.json(
      { error: "Erro interno ao gerar tiles" },
      { status: 500 }
    );
  }
}
