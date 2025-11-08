import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

import { clampTiles, writeWorkspace } from "@/lib/cookies-store";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";

const requestSchema = z.object({
  companyName: z.string().min(2),
  companyWebsite: z.string().url(),
  solution: z.string().min(2),
});

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_TOKENS = (() => {
  const raw = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(raw) && raw > 0 ? raw : 600;
})();
const TEMPERATURE = (() => {
  const raw = Number(process.env.OPENAI_TEMPERATURE);
  return Number.isFinite(raw) ? raw : 0.7;
})();

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

function interpolate(template: string, company: string, solution: string) {
  return template
    .replace(/{company}/gi, company)
    .replace(/{solution}/gi, solution);
}

function coerceToText(value: unknown): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(coerceToText).filter(Boolean).join("");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("output_text" in record) return coerceToText(record.output_text);
    if ("text" in record) return coerceToText(record.text);
    if ("content" in record) return coerceToText(record.content);
    if ("value" in record) return coerceToText(record.value);
    if ("parts" in record) return coerceToText(record.parts);
    if ("messages" in record) return coerceToText(record.messages);
  }
  return "";
}

function extractResponseContent(
  response: Awaited<ReturnType<OpenAI["responses"]["create"]>>
): string {
  const safeResponse = response as {
    output_text?: unknown;
    output?: unknown;
  };

  const fromOutput = coerceToText(safeResponse.output_text);
  if (fromOutput.trim()) {
    return fromOutput.trim();
  }

  if (Array.isArray(safeResponse.output)) {
    const aggregated = safeResponse.output
      .map((item: unknown) => coerceToText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (aggregated) return aggregated;
  }

  return "";
}

async function generateTile(
  client: OpenAI,
  prompt: string,
  title: string,
  orderIndex: number
) {
  console.log("[api/generate] 🧠 Chamando OpenAI para tile", {
    orderIndex,
    title,
    promptPreview: prompt.substring(0, 120),
    model: MODEL,
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });

  const normalizedModel = MODEL.trim();
  const lowerModel = normalizedModel.toLowerCase();
  const shouldSendTemperature =
    !lowerModel.startsWith("gpt-5") && Number.isFinite(TEMPERATURE);

  if (!shouldSendTemperature && Number.isFinite(TEMPERATURE)) {
    console.log(
      `[api/generate] ℹ️ Ignorando temperature para modelo ${normalizedModel} (Responses API)`
    );
  }

  const completion = await client.responses.create({
    model: normalizedModel,
    input: prompt,
    max_output_tokens: MAX_TOKENS,
  });

  const content = extractResponseContent(completion) || "Sem resposta gerada";

  console.log("[api/generate] ✅ Tile gerado", {
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
  } satisfies Tile;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    console.warn(
      "[api/generate] ⚠️ Dados inválidos",
      parseResult.error.flatten()
    );
    return NextResponse.json(
      { error: "Dados inválidos", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { companyName, companyWebsite, solution } = parseResult.data;

  if (!process.env.OPENAI_API_KEY) {
    console.error("[api/generate] ❌ OPENAI_API_KEY não configurada");
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    console.log("[api/generate] 📤 Payload:", {
      companyName,
      companyWebsite,
      solution,
    });

    const prompts = TILE_PROMPTS.map((item) => ({
      ...item,
      prompt: interpolate(item.template, companyName, solution),
    }));

    const tiles: Tile[] = [];

    for (const [index, item] of prompts.entries()) {
      try {
        const tile = await generateTile(openai, item.prompt, item.title, index);
        tiles.push(tile);
      } catch (error) {
        console.error("[api/generate] ⚠️ Falha ao gerar tile", {
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

    console.log("[api/generate] ✅ Tiles gerados/com fallback", {
      total: tiles.length,
      fallbackCount: tiles.filter((tile) => tile.title.endsWith("(fallback)"))
        .length,
    });

    const now = new Date().toISOString();
    const normalizedTiles: Tile[] = tiles.map((tile, index) => ({
      id: tile.id ?? `tile_${index}_${Date.now().toString(36)}`,
      title: tile.title ?? `Insight ${index + 1}`,
      content: clampTiles(tile.content ?? "Sem conteúdo gerado"),
      orderIndex: tile.orderIndex ?? index,
      createdAt: tile.createdAt ?? now,
    }));

    const workspace: WorkspaceSnapshot = {
      sessionId: `session_${randomUUID()}`,
      generatedAt: now,
      tilesToGenerate: normalizedTiles.length,
      company: {
        id: `company_${randomUUID()}`,
        name: companyName,
        website: companyWebsite,
        tiles: normalizedTiles,
        notes: [],
        contacts: [],
      },
    };

    await writeWorkspace(workspace);

    console.log("[api/generate] 💾 Workspace gravado em cookie", {
      tilesGenerated: normalizedTiles.length,
      generatedAt: workspace.generatedAt,
    });

    return NextResponse.json({
      success: true,
      tilesGenerated: normalizedTiles.length,
    });
  } catch (error) {
    console.error("[api/generate] ❌ Erro inesperado", error);
    return NextResponse.json(
      { error: "Erro inesperado ao gerar insights" },
      { status: 500 }
    );
  }
}
