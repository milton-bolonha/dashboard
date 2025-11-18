export type TileMessageRole = "assistant" | "user" | "system";

export interface TileMessage {
  id: string;
  role: TileMessageRole;
  content: string;
  createdAt: string;
}

export interface Tile {
  id: string;
  title: string;
  content: string;
  prompt: string;
  templateId?: string;
  templateTileId?: string;
  category?: string;
  model: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  totalTokens?: number | null;
  attempts: number;
  history: TileMessage[];
  agentId?: string;
  responseLength?: "short" | "medium" | "long";
  promptVariables?: string[];
}

export interface TileChatAttachment {
  id: string;
  name: string;
  url?: string;
  mimeType?: string;
  size?: number;
  textContent?: string;
  dataUrl?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactOutreachTile {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactOutreach {
  contactInsights?: ContactOutreachTile;
  emailPitch?: ContactOutreachTile;
  coldCallScript?: ContactOutreachTile;
}

export interface Contact {
  id: string;
  name: string;
  jobTitle?: string;
  linkedinUrl?: string;
  createdAt: string;
  outreach?: ContactOutreach;
  chatHistory?: TileMessage[];
}

export interface WorkspaceCompany {
  id: string;
  name: string;
  website?: string;
  tiles: Tile[];
  notes: Note[];
  contacts: Contact[];
}

export interface WorkspaceAppearance {
  baseColor: string;
  surfaceColor?: string;
  sidebarColor?: string;
  headingColor?: string; // Added: heading color (same as textColor but saved separately for clarity)
  textColor?: string;
  mutedTextColor?: string;
}

export interface WorkspacePromptSettings {
  templateId: string;
  model?: string;
  promptAgent?: string;
  responseLength?: "short" | "medium" | "long";
  promptVariables?: string[];
  bulkPrompts?: string[];
  target?: string;
  sellingSolutionsFor?: string;
  targetWebsite?: string;
}

export interface WorkspaceSnapshot {
  sessionId: string;
  company: WorkspaceCompany;
  generatedAt: string | null;
  tilesToGenerate: number;
  promptSettings?: WorkspacePromptSettings;
  appearance?: WorkspaceAppearance;
}

