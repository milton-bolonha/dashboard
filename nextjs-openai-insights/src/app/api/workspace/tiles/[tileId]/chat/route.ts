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

  // Add tile history to conversation context
  const history = tile.history || [];
  console.log(`[API] buildConversationMessages - Tile history length: ${history.length}`);
  
  history.forEach((entry, index) => {
    const role =
      entry.role === "assistant"
        ? "assistant"
        : entry.role === "system"
        ? "system"
        : "user";
    const content = entry.content || "";
    console.log(`[API] buildConversationMessages - History entry ${index}: role=${role}, content length=${content.length}`);
    messages.push({
      role,
      content,
    });
  });

  // Add current user message
  messages.push({ role: "user", content: userMessage });
  console.log(`[API] buildConversationMessages - Total messages: ${messages.length} (system: 1, history: ${history.length}, user: 1)`);
  return messages;
}

/**
 * Converts chat messages to GPT-5 input format
 * GPT-5 uses responses.create() API with input array format
 * Input is an array of message objects similar to chat completions
 */
function convertMessagesToInput(messages: ConversationTurn[]): Array<{ role: string; content: string }> {
  // GPT-5 input format: array of message objects with role and content
  // Similar structure to chat completions messages
  return messages.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
}

/**
 * Determines if a model uses the new responses API (GPT-5) or chat completions API (GPT-4)
 */
function isGPT5Model(model: string): boolean {
  return model.startsWith("gpt-5");
}

/**
 * Runs a chat attempt using the appropriate API based on the model
 */
async function runChatAttempt(
  client: OpenAI,
  input: ConversationTurn[],
  model: string
) {
  const isGPT5 = isGPT5Model(model);
  
  if (isGPT5) {
    // GPT-5 models use responses.create() API
    const gpt5Input = convertMessagesToInput(input);
    
    const params = {
      model,
      input: gpt5Input,
      text: {
        format: {
          type: "text",
        },
        verbosity: "medium" as const,
      },
      reasoning: {
        effort: "medium" as const,
      },
      tools: [],
      store: false,
      include: [
        "reasoning.encrypted_content",
        "web_search_call.action.sources",
      ],
    };
    
    console.log(`[API] runChatAttempt - Using GPT-5 responses API for model ${model}`);
    return client.responses.create(params as any);
  } else {
    // GPT-4 and older models use chat.completions.create() API
    const isNewModel = model.includes("o1") || model.includes("o4-mini") || model.includes("gpt-4o-mini");
    const params: Record<string, unknown> = {
      model,
      messages: input.map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
    };
    
    if (isNewModel) {
      // Some newer GPT-4 models use max_completion_tokens
      params.max_completion_tokens = DEFAULT_MAX_OUTPUT_TOKENS;
    } else {
      params.max_tokens = DEFAULT_MAX_OUTPUT_TOKENS;
    }
    
    // GPT-4o-mini can also use max_output_tokens according to examples
    if (model.includes("gpt-4o-mini")) {
      params.max_output_tokens = DEFAULT_MAX_OUTPUT_TOKENS;
    }
    
    console.log(`[API] runChatAttempt - Using GPT-4 chat completions API for model ${model}`);
    return client.chat.completions.create(params as any);
  }
}

// coerceToText removed - no longer used with chat completions API

function extractAssistantContent(
  response: Awaited<ReturnType<typeof runChatAttempt>>,
  model?: string
) {
  // Check if this is a GPT-5 response (responses API)
  // GPT-5 responses have different structure than chat completions
  const responseAny = response as any;
  const isGPT5Response = !!(responseAny.output || responseAny.text || responseAny.content);
  
  if (isGPT5Response || (model && isGPT5Model(model))) {
    // GPT-5 responses API structure - can have multiple formats
    const gpt5Response = responseAny;
    
    console.log(`[API] extractAssistantContent - GPT-5 response structure:`, {
      hasOutputText: !!gpt5Response.output_text,
      hasOutput: !!gpt5Response.output,
      outputLength: Array.isArray(gpt5Response.output) ? gpt5Response.output.length : 0,
      hasText: !!gpt5Response.text,
      hasContent: !!gpt5Response.content,
      textKeys: gpt5Response.text ? Object.keys(gpt5Response.text) : [],
      allKeys: Object.keys(gpt5Response),
    });
    
    // Try output_text first (direct field in GPT-5 responses)
    if (gpt5Response.output_text && typeof gpt5Response.output_text === "string") {
      const trimmed = gpt5Response.output_text.trim();
      if (trimmed) {
        console.log(`[API] extractAssistantContent - Found content in output_text:`, trimmed.substring(0, 100));
        return trimmed;
      }
    }
    
    // Try output array (contains message items with content)
    if (gpt5Response.output && Array.isArray(gpt5Response.output)) {
      for (const item of gpt5Response.output) {
        if (!item) continue;
        
        // Check for message type with content array
        if (item.type === "message" && item.content && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem && contentItem.type === "output_text" && contentItem.text) {
              const trimmed = contentItem.text.trim();
              if (trimmed) {
                console.log(`[API] extractAssistantContent - Found content in output[].content[].text:`, trimmed.substring(0, 100));
                return trimmed;
              }
            }
            // Also check for direct text field
            if (contentItem && contentItem.text && typeof contentItem.text === "string") {
              const trimmed = contentItem.text.trim();
              if (trimmed) {
                console.log(`[API] extractAssistantContent - Found content in output[].content[].text (direct):`, trimmed.substring(0, 100));
                return trimmed;
              }
            }
          }
        }
        
        // Check for direct text/content fields in output items
        if (item.text && typeof item.text === "string") {
          const trimmed = item.text.trim();
          if (trimmed) {
            console.log(`[API] extractAssistantContent - Found content in output[].text:`, trimmed.substring(0, 100));
            return trimmed;
          }
        }
        if (item.content && typeof item.content === "string") {
          const trimmed = item.content.trim();
          if (trimmed) {
            console.log(`[API] extractAssistantContent - Found content in output[].content:`, trimmed.substring(0, 100));
            return trimmed;
          }
        }
      }
    }
    
    // Try text object (alternative format)
    if (gpt5Response.text) {
      const textObj = gpt5Response.text;
      const content = textObj.content || textObj.value || textObj.text || "";
      if (content && typeof content === "string") {
        const trimmed = content.trim();
        if (trimmed) {
          console.log(`[API] extractAssistantContent - Found content in text:`, trimmed.substring(0, 100));
          return trimmed;
        }
      }
    }
    
    // Try direct content field
    if (gpt5Response.content && typeof gpt5Response.content === "string") {
      const trimmed = gpt5Response.content.trim();
      if (trimmed) {
        console.log(`[API] extractAssistantContent - Found content in direct field:`, trimmed.substring(0, 100));
        return trimmed;
      }
    }
    
    console.log(`[API] extractAssistantContent - No content found in GPT-5 response`);
    return "";
  }
  
  // GPT-4 chat completions API structure
  const safeResponse = response as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
      delta?: {
        content?: string | null;
      };
    }>;
  };

  console.log(`[API] extractAssistantContent - GPT-4 response structure:`, {
    hasChoices: !!safeResponse.choices,
    choicesLength: safeResponse.choices?.length ?? 0,
    firstChoice: safeResponse.choices?.[0] ? {
      hasMessage: !!safeResponse.choices[0].message,
      hasContent: !!safeResponse.choices[0].message?.content,
      contentLength: safeResponse.choices[0].message?.content?.length ?? 0,
      hasDelta: !!safeResponse.choices[0].delta,
    } : null,
  });

  if (safeResponse.choices && safeResponse.choices.length > 0) {
    const choice = safeResponse.choices[0];
    // Try message.content first (standard completion)
    const content = choice?.message?.content;
    if (content) {
      const trimmed = content.trim();
      console.log(`[API] extractAssistantContent - Found content in message:`, trimmed.substring(0, 100));
      return trimmed;
    }
    // Try delta.content (streaming)
    const deltaContent = choice?.delta?.content;
    if (deltaContent) {
      const trimmed = deltaContent.trim();
      console.log(`[API] extractAssistantContent - Found content in delta:`, trimmed.substring(0, 100));
      return trimmed;
    }
    console.log(`[API] extractAssistantContent - No content found in choice`);
  }

  console.log(`[API] extractAssistantContent - No choices found, returning empty string`);
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
    
    console.log(`[API] /api/workspace/tiles/${tileId}/chat - Conversation messages:`, {
      totalMessages: conversationInput.length,
      systemMessage: conversationInput[0]?.role === "system",
      historyMessages: conversationInput.length - 2, // -2 porque tem system e user message
      userMessage: conversationInput[conversationInput.length - 1]?.content?.substring(0, 100),
    });

    while (attempt < MAX_CHAT_ATTEMPTS) {
      attempt += 1;
      try {
        console.log(`[API] /api/workspace/tiles/${tileId}/chat - Attempt ${attempt}: Calling OpenAI with model ${model}`);
        const response = await runChatAttempt(openai, conversationInput, model);
        console.log(`[API] /api/workspace/tiles/${tileId}/chat - Response received:`, {
          hasResponse: !!response,
          responseType: typeof response,
          responseKeys: response ? Object.keys(response) : [],
          isGPT5: isGPT5Model(model),
        });
        assistantContent = extractAssistantContent(response, model).trim();
        console.log(`[API] /api/workspace/tiles/${tileId}/chat - Extracted content length: ${assistantContent.length}`);

        if (!assistantContent) {
          console.error(`[API] /api/workspace/tiles/${tileId}/chat - Empty response from OpenAI. Full response:`, JSON.stringify(response, null, 2));
          throw new Error("empty_response");
        }

        // Extract usage information (structure differs between GPT-4 and GPT-5)
        if (isGPT5Model(model)) {
          // GPT-5 responses API may have usage in a different location
          const gpt5Response = response as any;
          usage = (gpt5Response.usage || gpt5Response.metadata?.usage || null) as Record<string, unknown> | null;
        } else {
          // GPT-4 chat completions API
          usage = (response as any).usage || null;
        }
        break;
      } catch (error) {
        lastError = error;
        console.error(`[API] /api/workspace/tiles/${tileId}/chat - Attempt ${attempt} failed:`, error);
        if (error instanceof Error) {
          console.error(`[API] /api/workspace/tiles/${tileId}/chat - Error message:`, error.message);
          console.error(`[API] /api/workspace/tiles/${tileId}/chat - Error stack:`, error.stack);
        }
        if (attempt >= MAX_CHAT_ATTEMPTS) {
          break;
        }
        const backoff = Math.pow(2, attempt) * CHAT_RETRY_DELAY_MS;
        console.log(`[API] /api/workspace/tiles/${tileId}/chat - Retrying in ${backoff}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    if (!assistantContent) {
      const errorMessage = lastError instanceof Error ? lastError.message : String(lastError ?? "Unknown error");
      const errorDetails = lastError instanceof Error ? {
        message: lastError.message,
        name: lastError.name,
        stack: lastError.stack,
      } : { raw: String(lastError) };
      
      console.error(`[API] /api/workspace/tiles/${tileId}/chat - Failed after ${MAX_CHAT_ATTEMPTS} attempts`);
      console.error(`[API] /api/workspace/tiles/${tileId}/chat - Error details:`, errorDetails);
      console.error(`[API] /api/workspace/tiles/${tileId}/chat - Model used: ${model}`);
      
      return NextResponse.json(
        {
          error: "AI did not return content",
          details: errorMessage,
          model,
          attempts: MAX_CHAT_ATTEMPTS,
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

  console.log(`[API] /api/workspace/tiles/${tileId}/chat - Saving history:`, {
    previousHistoryLength: existingTile.history?.length ?? 0,
    newHistoryLength: trimmedHistory.length,
    userMessageLength: formattedUserMessage.length,
    assistantMessageLength: assistantContent.length,
  });

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
        console.error(`[API] /api/workspace/tiles/${tileId}/chat - Tile not found in snapshot during update`);
        return snapshot;
      }

      const nextTiles = [...currentTiles];
      nextTiles[index] = updatedTile;

      const updated = {
        ...snapshot,
        company: {
          ...snapshot.company,
          tiles: nextTiles,
        },
      };
      
      console.log(`[API] /api/workspace/tiles/${tileId}/chat - Workspace updated:`, {
        sessionId: updated.sessionId,
        tileIndex: index,
        tileHistoryLength: updatedTile.history?.length ?? 0,
      });

      return updated;
    });

    const refreshedTile =
      updatedWorkspace.company.tiles.find((tile) => tile.id === tileId) ??
      updatedTile;

    console.log(`[API] /api/workspace/tiles/${tileId}/chat - Returning tile with history:`, {
      tileId: refreshedTile.id,
      historyLength: refreshedTile.history?.length ?? 0,
      lastEntry: refreshedTile.history?.[refreshedTile.history.length - 1]?.content?.substring(0, 50),
    });

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

