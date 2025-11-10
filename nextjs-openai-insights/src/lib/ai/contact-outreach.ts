import { randomUUID } from "crypto";
import OpenAI from "openai";

import {
  generateMockTileContent,
  generateTileContent,
  type TileGenerationOptions,
  type TileGenerationResult,
} from "@/lib/ai/tile-generation";
import { resolveModel } from "@/lib/ai/settings";
import type {
  Contact,
  ContactOutreach,
  ContactOutreachTile,
  Note,
  Tile,
  WorkspaceCompany,
} from "@/lib/types";

const USE_MOCK_OPENAI = process.env.MOCK_OPENAI_RESPONSES === "true";
const CONTACT_TEMPLATE_ID = "contact_outreach";

function truncate(value: string, limit = 160) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

function buildTileSummary(tiles: Tile[], limit = 3) {
  if (!tiles.length) return "No AI insights available yet.";
  return tiles
    .slice(0, limit)
    .map(
      (tile) =>
        `- ${tile.title}: ${truncate(tile.content?.trim() ?? "", 140)}`,
    )
    .join("\n");
}

function buildNotesSummary(notes: Note[], limit = 3) {
  if (!notes.length) return "No notes captured.";
  return notes
    .slice(0, limit)
    .map((note) => `- ${note.title || "Untitled"}: ${truncate(note.content, 120)}`)
    .join("\n");
}

function composeOutreachTile(
  key: keyof ContactOutreach,
  title: string,
  generation: TileGenerationResult,
): ContactOutreachTile {
  return {
    id: `${key}_${randomUUID()}`,
    title,
    content: generation.content,
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt,
  };
}

export async function generateContactOutreach({
  contact,
  company,
  tiles,
  notes,
  model,
}: {
  contact: Contact;
  company: WorkspaceCompany;
  tiles: Tile[];
  notes: Note[];
  model?: string;
}): Promise<ContactOutreach> {
  const resolvedModel = resolveModel(model);
  const tilesSummary = buildTileSummary(tiles);
  const notesSummary = buildNotesSummary(notes);

  const baseContext = `
COMPANY:
- Name: ${company.name}
- Website: ${company.website || "Not provided"}
- Industry: ${company?.id?.split("_")[0] || "Unknown"}

INSIGHT SUMMARY (latest AI tiles):
${tilesSummary}

NOTES CAPTURED:
${notesSummary}
`.trim();

  const prompts: Array<{
    key: keyof ContactOutreach;
    title: string;
    instructions: string;
    orderIndex: number;
  }> = [
    {
      key: "contactInsights",
      title: "Contact Insights",
      orderIndex: 0,
      instructions: `
Analyze this contact for sales outreach:
CONTACT:
- Name: ${contact.name}
- Role: ${contact.jobTitle || "Unknown role"}
- Company: ${company.name}

${baseContext}

Provide concise bullet points highlighting:
- Role responsibilities and KPIs
- Likely challenges/pain points
- Motivations and triggers for outreach
- Recommended talk tracks
Limit to 180 words. Use a friendly but professional tone.`,
    },
    {
      key: "emailPitch",
      title: "Email Pitch",
      orderIndex: 1,
      instructions: `
Draft a personalized cold email for this contact:
CONTACT:
- Name: ${contact.name}
- Role: ${contact.jobTitle || "Unknown role"}
- Company: ${company.name}

${baseContext}

Email requirements:
- Subject line tailored to ${company.name}
- Reference their goals or pain points
- Keep the body under 90 words
- Include up to 3 short bullet points
- Close with a clear CTA
Return as Subject: [...] / Body: [...]`,
    },
    {
      key: "coldCallScript",
      title: "Cold Call Script",
      orderIndex: 2,
      instructions: `
Create a cold call opening script:
CONTACT:
- Name: ${contact.name}
- Role: ${contact.jobTitle || "Unknown role"}
- Company: ${company.name}

${baseContext}

Structure:
- Opening hook referencing their context
- Value proposition (2 concise sentences)
- 3 discovery questions
- Suggested next step
- Quick objection handler
Keep it under 150 words, conversational tone.`,
    },
  ];

  const shouldUseMock =
    USE_MOCK_OPENAI || !process.env.OPENAI_API_KEY || resolvedModel === "mock";

  let client: OpenAI | null = null;
  if (!shouldUseMock) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }

  const results = await Promise.all(
    prompts.map(async (promptConfig) => {
      const payload: TileGenerationOptions = {
        client: client ?? undefined,
        prompt: promptConfig.instructions.trim(),
        title: promptConfig.title,
        templateId: CONTACT_TEMPLATE_ID,
        templateTileId: promptConfig.key,
        category: "contact",
        model: resolvedModel,
        orderIndex: promptConfig.orderIndex,
      };

      try {
        const generation = shouldUseMock
          ? generateMockTileContent(payload)
          : await generateTileContent(payload);

        return composeOutreachTile(
          promptConfig.key,
          promptConfig.title,
          generation,
        );
      } catch (error) {
        console.error(
          "[contact-outreach] Failed to generate tile",
          promptConfig.key,
          error,
        );
        const fallback = generateMockTileContent(payload);
        return composeOutreachTile(
          promptConfig.key,
          `${promptConfig.title} (fallback)`,
          fallback,
        );
      }
    }),
  );

  return {
    contactInsights: results[0],
    emailPitch: results[1],
    coldCallScript: results[2],
  };
}


