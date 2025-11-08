import type { Tile } from "@/lib/types";

type TemplateTile = Tile & {
  prompt: string;
  category: string;
  order: number;
  defaultSize: { w: number; h: number };
};

interface GuestTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tiles: TemplateTile[];
}

interface GuestTemplatesMap {
  [templateId: string]: GuestTemplate;
}

export const GUEST_DASHBOARD_TEMPLATES: GuestTemplatesMap = {
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "Eight high-signal tiles for accelerated research.",
    icon: "📊",
    tiles: [
      {
        id: "company_description",
        title: "What They Do",
        prompt:
          "Summarize what {company.name} does in three short bullet points (≤15 words each). Cover core offering, primary customers, and a differentiator. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        orderIndex: 0,
        order: 1,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt:
          "In ≤120 words, outline how {company.name} earns revenue today. Cite main products/services, fee or subscription mechanics, and any marketplace or usage-based streams. If details are unclear, explain the most likely model and explicitly note remaining gaps.",
        category: "financial",
        orderIndex: 1,
        order: 2,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "international_offices",
        title: "International Presence",
        prompt:
          "Describe {company.name}'s geographic footprint in ≤90 words. Mention HQ, notable regional hubs, and any international offices, remote teams, or global service coverage. If locations are undisclosed, explain how the company currently serves international audiences.",
        category: "market",
        orderIndex: 2,
        order: 3,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "List up to three current strategic priorities for {company.name} over the next 12 months. Reference recent product launches, press releases, investor updates, or leadership quotes—cite the source and year (e.g., 2024 Investor Letter). If no goals are public, explain the best inferred focus area.",
        category: "strategy",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "Highlight up to three pressing challenges {company.name} faces this year. Mention market, operational, or competitive pressures and cite recent signals when available. If direct evidence is limited, infer from industry trends and clearly label the assumption.",
        category: "insights",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Explain in ≤120 words why {company.name} would benefit from {sellingSolutionsFor}. Tie pains or goals to concrete outcomes the solution provides. If specific data is missing, use a closest-fit assumption for companies of similar size and note it.",
        category: "sales",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "Provide a concise profile of {company.name}'s CEO: name, tenure, notable prior roles, and one leadership focus. If the CEO is not public, cite the highest-ranking executive available and note the gap.",
        category: "people",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Write a 100-word email to the CEO of {company.name} pitching {sellingSolutionsFor} from {salesRepAt}. Reference one goal or challenge above, include two bullet-point benefits, and close with a clear call to discuss next steps.",
        category: "sales",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
    ],
  },
  template_2: {
    id: "template_2",
    name: "Deep Dive Research",
    description: "Nine tiles for advanced competitive and strategic analysis.",
    icon: "🔍",
    tiles: [
      {
        id: "company_description_2",
        title: "What They Do",
        prompt:
          "Summarize what {company.name} does in three short bullet points (≤15 words each). Cover offer, core customers, and a differentiator. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        orderIndex: 0,
        order: 1,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "revenue_model_2",
        title: "Revenue Generation",
        prompt:
          "In ≤120 words, outline how {company.name} earns revenue today. Cite principal products/services, fee structures, and any recurring or usage-based income. Note remaining unknowns if data is incomplete.",
        category: "financial",
        orderIndex: 1,
        order: 2,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "biggest_goal_2025",
        title: "Biggest 2025 Goal",
        prompt:
          "State {company.name}'s single most visible strategic goal for the coming year. Reference the latest credible source (press release, leadership quote, investor deck) and describe the goal in ≤75 words. If no explicit goal exists, provide the best inferred priority and label it as such.",
        category: "strategy",
        orderIndex: 2,
        order: 3,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "industry_challenges",
        title: "Industry Challenges",
        prompt:
          "Identify up to three challenges impacting {company.name}'s industry this year. Mention market, regulatory, or competitive pressures and cite the latest supporting signal. If specific intel is missing, note the assumption and why it matters.",
        category: "insights",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "solution_need_2",
        title: "Solution Need",
        prompt:
          "Explain in ≤120 words why {company.name} may need {sellingSolutionsFor}. Link pains or objectives to two concrete benefits and cite any supporting signals. If data is thin, ground the answer in similar companies' needs and note the assumption.",
        category: "sales",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "top_competitors",
        title: "Top Competitors",
        prompt:
          "List up to five of {company.name}'s closest competitors with one-line explanations of how each competes. If direct competitors are unclear, cite the nearest category alternatives and note the rationale.",
        category: "market",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "holding_company",
        title: "Ownership/Funding",
        prompt:
          "Does {company.name} report a holding company or controlling investors? Summarize ownership structure, major investors, and latest funding status. If not disclosed, note the company as independent and reference the most recent funding signal.",
        category: "financial",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "ceo_info_2",
        title: "CEO Information",
        prompt:
          "Provide a concise profile of {company.name}'s CEO: name, tenure, notable achievements, and one leadership priority. If the CEO is undisclosed, highlight the most senior public executive and clarify the gap.",
        category: "people",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
      },
      {
        id: "cold_call_scripts",
        title: "Cold Call Scripts",
        prompt:
          "Based on the insights above, draft two 2-sentence cold-call openers pitching {sellingSolutionsFor} to {company.name}'s CEO. Reference a specific goal or challenge in each opener and end with an open question.",
        category: "sales",
        orderIndex: 8,
        order: 9,
        defaultSize: { w: 4, h: 2 },
        content: "",
        createdAt: "",
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

export function processPromptVariables(
  prompt: string,
  context: Record<string, any>,
): string {
  let processed = prompt;

  const entityFieldWithDefaultRegex =
    /\{(\w+)\.(\w+)\s*\|\|\s*'([^']+)'\}/g;
  processed = processed.replace(
    entityFieldWithDefaultRegex,
    (_match, entityName: string, fieldName: string, defaultValue: string) => {
      if (context[entityName] && context[entityName][fieldName]) {
        return safeStringValue(context[entityName][fieldName], defaultValue);
      }
      return defaultValue;
    },
  );

  const entityFieldRegex = /\{(\w+)\.(\w+)\}/g;
  processed = processed.replace(
    entityFieldRegex,
    (_match, entityName: string, fieldName: string) => {
      if (context[entityName] && context[entityName][fieldName]) {
        return safeStringValue(context[entityName][fieldName]);
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

