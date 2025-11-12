import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

import { clampTiles, readWorkspace, updateWorkspace } from "@/lib/cookies-store";
import type { Tile, TileMessage } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS, resolveModel } from "@/lib/ai/settings";

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
  textContent: z.string().optional(),
});

const messageSchema = z.object({
  message: z.string().min(2, "Message is too short"),
  model: z.string().min(2).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

const MAX_CHAT_ATTEMPTS = 2;
const CHAT_RETRY_DELAY_MS = 400;
const MAX_HISTORY_LENGTH = 12;
const USE_MOCK_OPENAI = process.env.MOCK_OPENAI_RESPONSES === "true";

type RouteContext = { params: Promise<{ tileId: string }> };

type ConversationTurn = {
  role: "assistant" | "system" | "user";
  content: string;
};

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
): ConversationTurn[] {
  const messages: ConversationTurn[] = [
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
  input: ConversationTurn[],
  model: string
) {
  return client.chat.completions.create({
    model,
    messages: input.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
  });
}

// coerceToText removed - no longer used with chat completions API

function extractAssistantContent(
  response: Awaited<ReturnType<typeof runChatAttempt>>
) {
  const safeResponse = response as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  if (safeResponse.choices && safeResponse.choices.length > 0) {
    const content = safeResponse.choices[0]?.message?.content;
    if (content) return content.trim();
  }

  return "";
}

export async function POST(request: Request, context: RouteContext) {
  const { tileId } = await context.params;

  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Starting request`);

  const body = await request.json().catch(() => null);
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Received body:`, body);

  const parseResult = messageSchema.safeParse(body);
  if (!parseResult.success) {
    console.error(`[API] /api/workspace/tiles/${tileId}/chat - Invalid payload:`, parseResult.error.flatten());
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const workspace = await readWorkspace();
  if (!workspace) {
    console.error(`[API] /api/workspace/tiles/${tileId}/chat - No workspace found`);
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 }
    );
  }
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Workspace found:`, workspace.sessionId);
  
  const tiles = workspace.company.tiles || [];
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Total tiles:`, tiles.length);
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Looking for tileId:`, tileId);
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Available tile IDs:`, tiles.map(t => t.id));
  
  const tileIndex = tiles.findIndex((tile) => tile.id === tileId);

  if (tileIndex === -1) {
    console.error(`[API] /api/workspace/tiles/${tileId}/chat - Tile not found in workspace`);
    return NextResponse.json(
      { error: "Tile not found", tileId, availableTiles: tiles.map(t => t.id) },
      { status: 404 }
    );
  }

  const existingTile = tiles[tileIndex];
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Found tile:`, existingTile.id);

  const attachments = parseResult.data.attachments ?? [];
  const userMessage = parseResult.data.message.trim();
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - User message: "${userMessage}"`);
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Attachments:`, attachments.length);

  const referenceLines = attachments
    .filter((item) => !item.textContent)
    .map((item) => {
      const metaParts: string[] = [];
      if (item.mimeType) metaParts.push(item.mimeType);
      if (typeof item.size === "number") {
        const kib = Math.max(Math.round(item.size / 1024), 1);
        metaParts.push(`${kib} KB`);
      }
      const meta = metaParts.length ? ` (${metaParts.join(", ")})` : "";
      if (item.url) {
        return `- ${item.name}${meta} → ${item.url}`;
      }
      return `- ${item.name}${meta}`;
    });
  const inlinePreviews = attachments
    .filter((item) => item.textContent)
    .map((item, index) => {
      const metaParts: string[] = [];
      if (item.mimeType) metaParts.push(item.mimeType);
      if (typeof item.size === "number") {
        const kib = Math.max(Math.round(item.size / 1024), 1);
        metaParts.push(`${kib} KB`);
      }
      const meta = metaParts.length ? ` (${metaParts.join(", ")})` : "";
      return `Attachment ${index + 1}: ${item.name}${meta}\n${item.textContent}`;
    });
  let formattedUserMessage = userMessage;
  if (referenceLines.length > 0) {
    formattedUserMessage += `\n\nAttachments:\n${referenceLines.join("\n")}`;
  }
  if (inlinePreviews.length > 0) {
    formattedUserMessage += `\n\nAttachment previews:\n${inlinePreviews.join("\n\n")}`;
  }
  const model = resolveModel(parseResult.data.model ?? existingTile.model);
  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Using model: ${model}`);

  const shouldMock =
    USE_MOCK_OPENAI || !process.env.OPENAI_API_KEY;

  let assistantContent = "";
  let usage:
    | Record<string, unknown>
    | null = null;

  if (shouldMock) {
    assistantContent = `Here’s a suggested follow-up based on your latest message:\n\n${formattedUserMessage}`;
  } else {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    let attempt = 0;
    let lastError: unknown = null;

    const conversationInput = buildConversationMessages(
      existingTile,
      formattedUserMessage
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
  }

  const timestamp = new Date().toISOString();
  const userEntry = timelineEntry("user", formattedUserMessage, timestamp);
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

  try {
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
  } catch {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 }
    );
  }
}

