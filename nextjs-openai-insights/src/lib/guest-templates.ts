export interface PromptAgentDefinition {
  id: string;
  label: string;
  description: string;
  defaultModel: string;
}

export const PROMPT_AGENTS = [
  {
    id: "ade_research_analyst",
    label: "Research Analyst (Ade)",
    description: "Consultoria focada em dados verificáveis e insights acionáveis.",
    defaultModel: "gpt-5-nano",
  },
  {
    id: "ade_sales_coach",
    label: "Sales Coach (Ade)",
    description:
      "Fala direta, CTA forte e direcionamento para movimento comercial imediato.",
    defaultModel: "gpt-4o-mini",
  },
] as const satisfies PromptAgentDefinition[];

export type PromptAgentId = (typeof PROMPT_AGENTS)[number]["id"];

export const PROMPT_RESPONSE_LENGTHS = [
  { id: "short" as const, label: "Curta" },
  { id: "medium" as const, label: "Média" },
  { id: "long" as const, label: "Longa" },
] as const;

export type PromptResponseLength =
  (typeof PROMPT_RESPONSE_LENGTHS)[number]["id"];

export const PROMPT_VARIABLE_DEFINITIONS = [
  {
    id: "includeRevenueSignals",
    label: "Sinais de receita",
    description: "Inclui dados financeiros, MRR e menções a funding.",
  },
  {
    id: "includeHiringSignals",
    label: "Contratações",
    description: "Destaca vagas abertas e movimentos de expansão de equipe.",
  },
  {
    id: "includeProductLaunches",
    label: "Lançamentos",
    description: "Menciona releases recentes, roadmap e novos produtos.",
  },
] as const;

export type PromptVariableId =
  (typeof PROMPT_VARIABLE_DEFINITIONS)[number]["id"];

export const DEFAULT_PROMPT_AGENT_ID: PromptAgentId =
  PROMPT_AGENTS[0]?.id ?? "ade_research_analyst";

interface TemplateTile {
  id: string;
  templateTileId?: string;
  title: string;
  prompt: string;
  category: string;
  orderIndex: number;
  order: number;
  defaultSize: { w: number; h: number };
  agentId?: PromptAgentId;
  preferredLength?: PromptResponseLength;
  bulkGroup?: string;
  defaultVariables?: PromptVariableId[];
  useMaxMode?: boolean;
  requestSize?: "small" | "medium" | "large";
}

interface TemplateDefaults {
  agentId?: PromptAgentId;
  responseLength?: PromptResponseLength;
  variables?: PromptVariableId[];
  useMaxMode?: boolean;
  requestSize?: "small" | "medium" | "large";
}

interface GuestTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tiles: TemplateTile[];
  defaults?: TemplateDefaults;
}

interface GuestTemplatesMap {
  [templateId: string]: GuestTemplate;
}

export interface ResolvedTemplateTile extends TemplateTile {
  agentId: PromptAgentId;
  preferredLength: PromptResponseLength;
  runtimeVariables: PromptVariableId[];
  useMaxMode: boolean;
  requestSize: "small" | "medium" | "large";
}

export interface ResolveTemplateOptions {
  templateId: string;
  agentId?: PromptAgentId;
  responseLength?: PromptResponseLength;
  promptVariables?: PromptVariableId[];
  bulkPrompts?: string[];
}

function mergeVariables(
  tileDefaults: PromptVariableId[] | undefined,
  runtime: PromptVariableId[] | undefined,
): PromptVariableId[] {
  const merged = new Set<PromptVariableId>(tileDefaults ?? []);
  (runtime ?? []).forEach((value) => merged.add(value));
  return Array.from(merged);
}

export function resolveTemplateTiles(
  template: GuestTemplate,
  options: ResolveTemplateOptions,
): ResolvedTemplateTile[] {
  const templateAgent = template.defaults?.agentId ?? DEFAULT_PROMPT_AGENT_ID;
  const templateLength = template.defaults?.responseLength ?? "medium";
  const templateVariables = template.defaults?.variables ?? [];
  const templateUseMaxMode = template.defaults?.useMaxMode ?? false;
  const templateRequestSize = template.defaults?.requestSize ?? "small";

  const runtimeAgent = options.agentId ?? templateAgent;
  const runtimeLength = options.responseLength ?? templateLength;
  const runtimeVariables = options.promptVariables ?? templateVariables;

  const resolvedBase = template.tiles.map<ResolvedTemplateTile>((tile) => {
    const mergedVariables = mergeVariables(tile.defaultVariables, runtimeVariables);
    return {
      ...tile,
      agentId: tile.agentId ?? runtimeAgent,
      preferredLength: tile.preferredLength ?? runtimeLength,
      runtimeVariables: mergedVariables,
      useMaxMode: tile.useMaxMode ?? templateUseMaxMode,
      requestSize: tile.requestSize ?? templateRequestSize,
    };
  });

  const bulkTiles =
    options.bulkPrompts?.map<ResolvedTemplateTile>((prompt, index) => {
      const id = `bulk_prompt_${index + 1}`;
      return {
        id,
        templateTileId: id,
        title: `Bulk Prompt ${index + 1}`,
        prompt,
        category: "bulk",
        orderIndex: resolvedBase.length + index,
        order: resolvedBase.length + index + 1,
        defaultSize: { w: 4, h: 2 },
        agentId: runtimeAgent,
        preferredLength: runtimeLength,
        runtimeVariables,
        bulkGroup: "csv_upload",
        useMaxMode: templateUseMaxMode,
        requestSize: templateRequestSize,
      };
    }) ?? [];

  return [...resolvedBase, ...bulkTiles].map((tile, index) => ({
    ...tile,
    orderIndex: index,
    order: index + 1,
  }));
}

export function getPromptAgent(agentId?: PromptAgentId): PromptAgentDefinition {
  return (
    PROMPT_AGENTS.find((agent) => agent.id === agentId) ??
    PROMPT_AGENTS[0]
  );
}

export const GUEST_DASHBOARD_TEMPLATES: GuestTemplatesMap = {
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "Eight high-signal tiles for accelerated research.",
    icon: "📊",
    defaults: {
      agentId: "ade_research_analyst",
      responseLength: "medium",
      variables: ["includeRevenueSignals", "includeProductLaunches"],
      useMaxMode: false,
      requestSize: "small",
    },
    tiles: [
      {
        id: "company_description",
        title: "What They Do",
        prompt:
          "Describe {company.name}'s core offering, primary customers, and differentiator in three short sentences (≤12 words each). Synthesize key information concisely. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        orderIndex: 0,
        order: 1,
        defaultSize: { w: 4, h: 2 },
        defaultVariables: ["includeProductLaunches"],
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt:
          "Summarize how {company.name} earns revenue in three short sentences (≤14 words each). Mention specific products, services, or fee structures when known. Synthesize the revenue model concisely. If unclear, state 'Revenue model not publicly disclosed yet.'",
        category: "financial",
        orderIndex: 1,
        order: 2,
        defaultSize: { w: 4, h: 2 },
        defaultVariables: ["includeRevenueSignals"],
      },
      {
        id: "international_offices",
        title: "International Presence",
        prompt:
          "Describe {company.name}'s geographic footprint in up to three short sentences (≤14 words each). Cover HQ location, key regions, and notable offices. Synthesize the international presence concisely. If unknown, state 'Geographic footprint not publicly disclosed yet.'",
        category: "market",
        orderIndex: 2,
        order: 3,
        defaultSize: { w: 4, h: 2 },
        defaultVariables: ["includeHiringSignals"],
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "Describe {company.name}'s 2025 priorities in up to two short sentences (≤14 words each). Include source/year in parentheses when known. Synthesize strategic goals concisely. If no public goals, state 'Strategic priorities not publicly available yet.'",
        category: "strategy",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "Highlight 2025 challenges for {company.name} in up to two short sentences (≤14 words each). Reference a recent signal in parentheses when available. Synthesize key challenges concisely. If unclear, state 'Challenges not publicly available yet.'",
        category: "insights",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Write two concise sentences (≤30 words each) explaining why {company.name} needs {sellingSolutionsFor}. Reference one goal or challenge. If evidence is missing, end with 'Need not publicly verified yet.'",
        category: "sales",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
        agentId: "ade_sales_coach",
        preferredLength: "medium",
        defaultVariables: ["includeProductLaunches"],
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "Provide CEO information in three short sentences (≤14 words each): CEO name and role, tenure, and one leadership focus. Synthesize executive details concisely. If CEO not public, mention highest-ranking executive and note 'Role not publicly confirmed.'",
        category: "people",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Draft a four-line email: line 1 greeting (≤8 words); line 2 value proposition referencing one goal/challenge (≤18 words); line 3 two hyphen bullets with specific benefits (≤10 words each); line 4 clear CTA (≤12 words). If data missing, mention 'Information not publicly available yet.'",
        category: "sales",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
        agentId: "ade_sales_coach",
        preferredLength: "long",
      },
    ],
  },
  template_2: {
    id: "template_2",
    name: "Deep Dive Research",
    description: "Nine tiles for advanced competitive and strategic analysis.",
    icon: "🔍",
    defaults: {
      agentId: "ade_research_analyst",
      responseLength: "long",
      variables: ["includeRevenueSignals", "includeHiringSignals"],
      useMaxMode: true,
      requestSize: "medium",
    },
    tiles: [
      {
        id: "company_description_2",
        title: "What They Do",
        prompt:
          "Describe {company.name}'s offering, core customers, and differentiator in three short sentences (≤12 words each). Synthesize key information concisely. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        orderIndex: 0,
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model_2",
        title: "Revenue Generation",
        prompt:
          "Describe how {company.name} earns revenue in three short sentences (≤14 words each). Cite specific products, services, or fee models when possible. Synthesize the revenue model concisely. If unclear, state 'Revenue model not publicly disclosed yet.'",
        category: "financial",
        orderIndex: 1,
        order: 2,
        defaultSize: { w: 4, h: 2 },
        defaultVariables: ["includeRevenueSignals"],
      },
      {
        id: "biggest_goal_2025",
        title: "Biggest 2025 Goal",
        prompt:
          "Describe {company.name}'s top 2025 goal in up to two short sentences (≤14 words each). Include source/year in parentheses when known. Synthesize the primary objective concisely. If unknown, state 'Goal not publicly available yet.'",
        category: "strategy",
        orderIndex: 2,
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "industry_challenges",
        title: "Industry Challenges",
        prompt:
          "Outline industry pressures on {company.name} in up to two short sentences (≤14 words each). Reference a credible signal in parentheses when available. Synthesize key industry challenges concisely. If unclear, state 'Industry challenges not publicly specified yet.'",
        category: "insights",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
        defaultVariables: ["includeHiringSignals"],
      },
      {
        id: "solution_need_2",
        title: "Solution Need",
        prompt:
          "Write two concise sentences (≤30 words each) explaining why {company.name} may need {sellingSolutionsFor}. Reference one pain or goal. If evidence is thin, end with 'Need not publicly verified yet.'",
        category: "sales",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
        agentId: "ade_sales_coach",
        preferredLength: "medium",
      },
      {
        id: "top_competitors",
        title: "Top Competitors",
        prompt:
          "List up to three competitors of {company.name} with one short reason each (≤12 words per competitor). Synthesize competitive landscape concisely. If unknown, state 'Competitors not publicly disclosed yet.'",
        category: "market",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "holding_company",
        title: "Ownership/Funding",
        prompt:
          "Summarize {company.name}'s ownership structure or key investors in up to two short sentences (≤14 words each). Include latest funding note if known. Synthesize ownership details concisely. If independent/undisclosed, state 'Ownership not publicly disclosed yet.'",
        category: "financial",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info_2",
        title: "CEO Information",
        prompt:
          "Provide CEO information in three short sentences (≤14 words each): CEO name and role, tenure or appointment year, and one leadership priority. Synthesize executive details concisely. If CEO unknown, mention most senior public executive and note 'Role not publicly confirmed.'",
        category: "people",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "cold_call_scripts",
        title: "Cold Call Scripts",
        prompt:
          "Provide two cold-call openers. Format as two numbered lines. Each line ≤25 words, reference one insight, and end with an open question. If insight unavailable, note 'Information not publicly available yet.'",
        category: "sales",
        orderIndex: 8,
        order: 9,
        defaultSize: { w: 4, h: 2 },
        agentId: "ade_sales_coach",
        preferredLength: "long",
      },
    ],
  },
};

export function getGuestTemplate(templateId: string): GuestTemplate {
  return (
    GUEST_DASHBOARD_TEMPLATES[templateId] ||
    GUEST_DASHBOARD_TEMPLATES.template_1
  );
}

function safeStringValue(
  value: unknown,
  defaultValue = "",
): string {
  if (!value) return defaultValue;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return (
      (record.name as string) ||
      (record.title as string) ||
      (record.value as string) ||
      JSON.stringify(record)
    );
  }
  return String(value);
}

type TemplateContext = Record<string, Record<string, unknown> | string | undefined>;

export function processPromptVariables(
  prompt: string,
  context: TemplateContext,
): string {
  let processed = prompt;

  const entityFieldWithDefaultRegex =
    /\{(\w+)\.(\w+)\s*\|\|\s*'([^']+)'\}/g;
  processed = processed.replace(
    entityFieldWithDefaultRegex,
    (_match, entityName: string, fieldName: string, defaultValue: string) => {
      const entity = context[entityName];
      if (entity && typeof entity === "object" && fieldName in entity) {
        const value = (entity as Record<string, unknown>)[fieldName];
        if (value) {
          return safeStringValue(value, defaultValue);
        }
      }
      return defaultValue;
    },
  );

  const entityFieldRegex = /\{(\w+)\.(\w+)\}/g;
  processed = processed.replace(
    entityFieldRegex,
    (_match, entityName: string, fieldName: string) => {
      const entity = context[entityName];
      if (entity && typeof entity === "object" && fieldName in entity) {
        const value = (entity as Record<string, unknown>)[fieldName];
        if (value) {
          return safeStringValue(value);
        }
      }
      return "";
    },
  );

  const simpleRegex = /\{(\w+)\}/g;
  processed = processed.replace(simpleRegex, (_match, varName: string) => {
    if (context[varName]) {
      return safeStringValue(context[varName]);
    }
    return "";
  });

  return processed;
}

