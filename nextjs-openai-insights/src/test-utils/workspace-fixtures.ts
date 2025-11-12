import type {
  Contact,
  Note,
  Tile,
  TileMessage,
  WorkspaceCompany,
  WorkspaceSnapshot,
} from "@/lib/types";

function generateId(prefix: string): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : null;
  if (globalCrypto && "randomUUID" in globalCrypto) {
    return `${prefix}_${globalCrypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createMessageFixture(
  overrides: Partial<TileMessage> = {},
): TileMessage {
  const timestamp = nowIso();
  return {
    id: overrides.id ?? generateId("msg"),
    role: overrides.role ?? "assistant",
    content: overrides.content ?? "Sample response content",
    createdAt: overrides.createdAt ?? timestamp,
  };
}

export function createTileFixture(overrides: Partial<Tile> = {}): Tile {
  const timestamp = nowIso();
  return {
    id: overrides.id ?? generateId("tile"),
    title: overrides.title ?? "Sample Insight",
    content: overrides.content ?? "This is a sample tile content for testing.",
    prompt:
      overrides.prompt ??
      "Provide three bullet points with the latest company highlights.",
    templateId: overrides.templateId,
    templateTileId: overrides.templateTileId,
    category: overrides.category ?? "basic",
    model: overrides.model ?? "gpt-5-mini",
    orderIndex: overrides.orderIndex ?? 0,
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
    totalTokens: overrides.totalTokens ?? 180,
    attempts: overrides.attempts ?? 1,
    history:
      overrides.history ??
      [
        createMessageFixture({
          role: "user",
          content: "What are the top 2025 goals?",
          createdAt: timestamp,
        }),
        createMessageFixture({
          role: "assistant",
          content: "The top goals include geographic expansion and margin growth.",
          createdAt: timestamp,
        }),
      ],
  };
}

export function createNoteFixture(overrides: Partial<Note> = {}): Note {
  const timestamp = nowIso();
  return {
    id: overrides.id ?? generateId("note"),
    title: overrides.title ?? "Key takeaway",
    content:
      overrides.content ??
      "Stakeholders prioritise expansion in LATAM. Mention the recent partnership.",
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,
  };
}

export function createContactFixture(
  overrides: Partial<Contact> = {},
): Contact {
  const timestamp = nowIso();
  return {
    id: overrides.id ?? generateId("contact"),
    name: overrides.name ?? "Jordan Blake",
    jobTitle: overrides.jobTitle ?? "VP Sales Operations",
    linkedinUrl:
      overrides.linkedinUrl ?? "https://www.linkedin.com/in/jordan-blake",
    createdAt: overrides.createdAt ?? timestamp,
    outreach: overrides.outreach ?? {
      contactInsights: {
        id: generateId("insight"),
        title: "Why reach out now",
        content:
          "Jordan is leading the CX initiative in Q1. Highlight automation gains.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    chatHistory:
      overrides.chatHistory ??
      [
        createMessageFixture({
          role: "user",
          content: "Draft a quick intro for Jordan.",
        }),
        createMessageFixture({
          role: "assistant",
          content:
            "Jordan, awesome to see your CX push. Can we share a pilot next week?",
        }),
      ],
  };
}

export function createWorkspaceCompanyFixture(
  overrides: Partial<WorkspaceCompany> = {},
): WorkspaceCompany {
  return {
    id: overrides.id ?? generateId("company"),
    name: overrides.name ?? "Acme Robotics",
    website: overrides.website ?? "https://www.acmerobotics.com",
    tiles: overrides.tiles ?? [createTileFixture()],
    notes: overrides.notes ?? [createNoteFixture()],
    contacts: overrides.contacts ?? [createContactFixture()],
  };
}

export function createWorkspaceFixture(
  overrides: Partial<WorkspaceSnapshot> = {},
): WorkspaceSnapshot {
  const generatedAt = nowIso();
  return {
    sessionId: overrides.sessionId ?? generateId("session"),
    generatedAt: overrides.generatedAt ?? generatedAt,
    tilesToGenerate: overrides.tilesToGenerate ?? 0,
    company: overrides.company ?? createWorkspaceCompanyFixture(),
    appearance: overrides.appearance ?? {
      baseColor: "#f5f5f0",
    },
    promptSettings: overrides.promptSettings,
  };
}

export const SAMPLE_WORKSPACE: WorkspaceSnapshot = createWorkspaceFixture();


