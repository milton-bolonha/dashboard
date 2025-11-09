import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

import {
  clampTiles,
  readWorkspace,
  updateWorkspace,
} from "@/lib/cookies-store";
import type { Tile, TileMessage } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS, resolveModel } from "@/lib/ai/settings";

const messageSchema = z.object({
  message: z.string().min(2, "Message is too short"),
  model: z.string().min(2).optional(),
});

const MAX_CHAT_ATTEMPTS = 2;
const CHAT_RETRY_DELAY_MS = 400;
const MAX_HISTORY_LENGTH = 12;

type RouteContext = { params: Promise<{ tileId: string }> };

function timelineEntry(
  role: TileMessage["role"],
  content: string,
  timestamp: string
): TileMessage {
  return {
    id: `${role}_${Date.now().toString(36)}`,
    role,
    content,
    createdAt: timestamp,
  };
}

function buildConversationMessages(
  tile: Tile,
  userMessage: string
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    {
      role: "system",
      content:
        "You are a senior sales intelligence analyst. Provide concise, data-backed insights. When referencing information, cite the source or year inline. Avoid repeating previous answers verbatim unless explicitly asked.",
    },
  ];

  tile.history.forEach((entry) => {
    const role =
      entry.role === "assistant"
        ? "assistant"
        : entry.role === "system"
        ? "system"
        : "user";
    messages.push({
      role,
      content: entry.content,
    });
  });

  messages.push({ role: "user", content: userMessage });
  return messages;
}

async function runChatAttempt(
  client: OpenAI,
  input: Array<{ role: string; content: string }>,
  model: string
) {
  return client.responses.create({
    model,
    input,
    max_output_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
  });
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

function extractAssistantContent(
  response: Awaited<ReturnType<typeof runChatAttempt>>
) {
  const safeResponse = response as {
    output_text?: unknown;
    output?: unknown;
  };

  const fromOutput = coerceToText(safeResponse.output_text);
  if (fromOutput.trim()) return fromOutput.trim();

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

export async function POST(request: Request, context: RouteContext) {
  const { tileId } = await context.params;

  const body = await request.json().catch(() => null);
  const parseResult = messageSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const workspace = await readWorkspace();
  const tiles = workspace.company.tiles || [];
  const tileIndex = tiles.findIndex((tile) => tile.id === tileId);

  if (tileIndex === -1) {
    return NextResponse.json(
      { error: "Tile not found" },
      { status: 404 }
    );
  }

  const existingTile = tiles[tileIndex];
  const userMessage = parseResult.data.message.trim();
  const model = resolveModel(parseResult.data.model ?? existingTile.model);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let attempt = 0;
  let lastError: unknown = null;
  let assistantContent = "";
  let usage:
    | Record<string, unknown>
    | null = null;

  const conversationInput = buildConversationMessages(
    existingTile,
    userMessage
  );

  while (attempt < MAX_CHAT_ATTEMPTS) {
    attempt += 1;
    try {
      const response = await runChatAttempt(openai, conversationInput, model);
      assistantContent = extractAssistantContent(response).trim();

      if (!assistantContent) {
        throw new Error("empty_response");
      }

      usage = (response.usage || null) as unknown as Record<
        string,
        unknown
      > | null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_CHAT_ATTEMPTS) {
        break;
      }
      const backoff = Math.pow(2, attempt) * CHAT_RETRY_DELAY_MS;
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  if (!assistantContent) {
    return NextResponse.json(
      {
        error: "AI did not return content",
        details: lastError
          ? String((lastError as Error).message ?? lastError)
          : undefined,
      },
      { status: 502 }
    );
  }

  const timestamp = new Date().toISOString();
  const userEntry = timelineEntry("user", userMessage, timestamp);
  const assistantEntry = timelineEntry("assistant", assistantContent, timestamp);
  const trimmedHistory = [...existingTile.history, userEntry, assistantEntry].slice(
    -MAX_HISTORY_LENGTH
  );

  const usageInfo = usage as
    | { total_tokens?: number | null; total_token_count?: number | null }
    | null;
  const totalTokens =
    usageInfo?.total_tokens ?? usageInfo?.total_token_count ?? null;

  const updatedTile: Tile = {
    ...existingTile,
    content: clampTiles(assistantContent),
    model,
    updatedAt: timestamp,
    totalTokens: totalTokens ?? existingTile.totalTokens ?? null,
    history: trimmedHistory,
  };

  const updatedWorkspace = await updateWorkspace((snapshot) => {
    const currentTiles = snapshot.company.tiles || [];
    const index = currentTiles.findIndex((tile) => tile.id === tileId);
    if (index === -1) {
      return snapshot;
    }

    const nextTiles = [...currentTiles];
    nextTiles[index] = updatedTile;

    return {
      ...snapshot,
      company: {
        ...snapshot.company,
        tiles: nextTiles,
      },
    };
  });

  const refreshedTile =
    updatedWorkspace.company.tiles.find((tile) => tile.id === tileId) ??
    updatedTile;

  return NextResponse.json({
    success: true,
    tile: refreshedTile,
  });
}

