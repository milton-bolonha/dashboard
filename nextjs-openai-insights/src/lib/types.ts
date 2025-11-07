export interface Tile {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  jobTitle?: string;
  linkedinUrl?: string;
  createdAt: string;
}

export interface WorkspaceCompany {
  id: string;
  name: string;
  website?: string;
  tiles: Tile[];
  notes: Note[];
  contacts: Contact[];
}

export interface WorkspaceSnapshot {
  sessionId: string;
  company: WorkspaceCompany;
  generatedAt: string | null;
  tilesToGenerate: number;
}

