import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

import { clampTiles, readWorkspace, updateWorkspace } from "@/lib/cookies-store";
import type { Contact, TileMessage } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS, resolveModel } from "@/lib/ai/settings";
import {
  toResponsesInput,
  type ConversationTurn,
} from "@/lib/ai/response-input";

const messageSchema = z.object({
  message: z.string().min(2, "Message is too short"),
  model: z.string().min(2).optional(),
});

const MAX_CHAT_ATTEMPTS = 2;
const CHAT_RETRY_DELAY_MS = 400;
const MAX_HISTORY_LENGTH = 12;
const USE_MOCK_OPENAI = process.env.MOCK_OPENAI_RESPONSES === "true";

type RouteContext = { params: Promise<{ contactId: string }> };

function timelineEntry(
  role: TileMessage["role"],
  content: string,
  timestamp: string,
): TileMessage {
  return {
    id: `${role}_${Date.now().toString(36)}`,
    role,
    content,
    createdAt: timestamp,
  };
}

function buildConversationMessages(
  contact: Contact,
  userMessage: string,
): ConversationTurn[] {
  const baseHistory = contact.chatHistory ?? [];
  const messages: ConversationTurn[] = [
    {
      role: "system",
      content:
        "You are a senior sales intelligence analyst assisting with stakeholder outreach. Deliver concise, data-backed insights that help sales teams advance conversations. When referencing prior context, keep it factual.",
    },
  ];

  baseHistory.forEach((entry) => {
    const role =
      entry.role === "assistant"
        ? "assistant"
        : entry.role === "system"
        ? "system"
        : "user";
    messages.push({ role, content: entry.content });
  });

  if (baseHistory.length === 0) {
    const baseline =
      contact.outreach?.contactInsights?.content ??
      "This conversation summarises the latest insights you've generated for this contact.";
    messages.push({ role: "assistant", content: baseline });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

async function runChatAttempt(
  client: OpenAI,
  input: ConversationTurn[],
  model: string,
) {
  return client.responses.create({
    model,
    input: toResponsesInput(input),
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
  response: Awaited<ReturnType<typeof runChatAttempt>>,
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
  const { contactId } = await context.params;

  const body = await request.json().catch(() => null);
  const parseResult = messageSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }

  const contacts = workspace.company.contacts || [];
  const contactIndex = contacts.findIndex((item) => item.id === contactId);
  if (contactIndex === -1) {
    return NextResponse.json(
      { error: "Contact not found" },
      { status: 404 },
    );
  }

  const existingContact = contacts[contactIndex];
  const userMessage = parseResult.data.message.trim();
  const model = resolveModel(parseResult.data.model ?? workspace.company.tiles?.[0]?.model ?? "gpt-4.1-mini");

  const shouldMock = USE_MOCK_OPENAI || !process.env.OPENAI_API_KEY;

  let assistantContent = "";
  let usage:
    | Record<string, unknown>
    | null = null;

  if (shouldMock) {
    assistantContent = `Here’s an updated insight for ${existingContact.name} based on your note:\n\n${userMessage}`;
  } else {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    let attempt = 0;
    let lastError: unknown = null;

    const conversationInput = buildConversationMessages(
      existingContact,
      userMessage,
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
        { status: 502 },
      );
    }
  }

  const timestamp = new Date().toISOString();
  const existingHistory = existingContact.chatHistory ?? [];
  const userEntry = timelineEntry("user", userMessage, timestamp);
  const assistantEntry = timelineEntry("assistant", assistantContent, timestamp);
  const trimmedHistory = [...existingHistory, userEntry, assistantEntry].slice(
    -MAX_HISTORY_LENGTH,
  );

  const usageInfo = usage as
    | { total_tokens?: number | null; total_token_count?: number | null }
    | null;
  const totalTokens =
    usageInfo?.total_tokens ?? usageInfo?.total_token_count ?? null;

  const updatedContact: Contact = {
    ...existingContact,
    chatHistory: trimmedHistory,
    outreach: existingContact.outreach
      ? {
          ...existingContact.outreach,
          contactInsights: existingContact.outreach.contactInsights
            ? {
                ...existingContact.outreach.contactInsights,
                content: clampTiles(assistantContent),
                updatedAt: timestamp,
              }
            : undefined,
        }
      : existingContact.outreach,
  };

  try {
    const updatedWorkspace = await updateWorkspace((snapshot) => {
      const currentContacts = snapshot.company.contacts || [];
      const index = currentContacts.findIndex((item) => item.id === contactId);
      if (index === -1) {
        return snapshot;
      }

      const nextContacts = [...currentContacts];
      nextContacts[index] = updatedContact;

      return {
        ...snapshot,
        company: {
          ...snapshot.company,
          contacts: nextContacts,
        },
      };
    });

    const refreshedContact =
      updatedWorkspace.company.contacts.find((c) => c.id === contactId) ??
      updatedContact;

    return NextResponse.json({
      success: true,
      contact: refreshedContact,
      tokens: totalTokens,
    });
  } catch {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }
}

