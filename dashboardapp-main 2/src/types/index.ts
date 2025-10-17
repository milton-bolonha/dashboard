export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  company: string | null;
  solution: string | null;
  dateOfBirth?: string;
  credits: number;
  subscription: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Contact {
  id: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  linkedinUrl: string | null;
  companyId: string | null;
  insights: ContactInsights | string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ContactInsights {
  painPoints: string[];
  triggers: string[];
  responsibilities: string[];
  decisionMakingRole: string;
  communicationStyle: string;
  priorities: string[];
}

export interface Dashboard {
  id: string;
  name: string;
  template: string;
  background: string | null;
  backgroundImage: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  companyId: string | null;
  tiles: Tile[];
}

export interface Tile {
  id: string;
  title: string;
  content: string | null;
  prompt: string | null;
  response?: string;
  position: number;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  type: 'prompt' | 'note' | 'event' | 'file';
  color: 'white' | 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  isFlipped: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  dashboardId: string;
  companyId: string | null;
}

export interface Outreach {
  id: string;
  type: 'email' | 'call' | 'linkedin';
  content: string;
  subject: string | null;
  status: 'draft' | 'sent' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  contactId: string | null;
  companyId: string | null;
}

export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
  userId: string;
  companyId: string | null;
  dashboardId: string | null;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  prompts: TemplatePrompt[];
  isDefault: boolean;
}

export interface TemplatePrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  position: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
}

export interface DashboardContext {
  company?: Company;
  contact?: Contact;
  user: User;
}

export interface TileUpdateData {
  title?: string;
  content?: string;
  prompt?: string;
  position?: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  type?: 'prompt' | 'note' | 'event' | 'file';
  color?: 'white' | 'orange' | 'blue' | 'green';
  isFlipped?: boolean;
}

export interface BulkPromptRequest {
  prompts: string[];
  companyId: string;
  contactId?: string;
}

export interface BulkPromptResponse {
  tiles: Tile[];
  totalTokens: number;
  estimatedCost: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'bonus' | 'referral';
  description?: string;
  createdAt: Date;
  userId: string;
}

export interface Referral {
  id: string;
  code: string;
  inviterId: string;
  inviteeId?: string;
  credits: number;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface CompanyFormData {
  name: string;
  url?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export interface ContactFormData {
  name: string;
  jobTitle?: string;
  email?: string;
  linkedinUrl?: string;
  companyId?: string;
}

export interface DashboardFormData {
  name: string;
  template: string;
  background: string;
  backgroundImage?: string;
  isPublic: boolean;
  companyId?: string;
}

export interface TileFormData {
  title: string;
  content?: string;
  prompt?: string;
  type: 'prompt' | 'note' | 'event' | 'file';
  color: 'white' | 'orange' | 'blue' | 'green';
}

// UI State Types
export interface DashboardState {
  selectedCompany?: Company;
  selectedContact?: Contact;
  selectedDashboard?: Dashboard;
  tiles: Tile[];
  isLoading: boolean;
  error?: string;
}

export interface TileState {
  isEditing: boolean;
  isGenerating: boolean;
  isFlipped: boolean;
  error?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'tile_update' | 'dashboard_update' | 'ai_response' | 'error';
  data: any;
  timestamp: Date;
}

export interface TileUpdateMessage extends WebSocketMessage {
  type: 'tile_update';
  data: {
    tileId: string;
    updates: Partial<Tile>;
  };
}

export interface AIResponseMessage extends WebSocketMessage {
  type: 'ai_response';
  data: {
    tileId: string;
    response: AIResponse;
  };
}
