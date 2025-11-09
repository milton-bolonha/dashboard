interface TemplateTile {
  id: string;
  templateTileId?: string;
  title: string;
  prompt: string;
  category: string;
  orderIndex: number;
  order: number;
  defaultSize: { w: number; h: number };
}

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
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "List 1-3 key priorities for {company.name} in 2025. Use 10-15 words per goal. Cite a recent source if available. If unknown, state 'Goals not publicly available yet.'",
        category: "strategy",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "List 1-3 challenges for {company.name}. Use 10-20 words per challenge. Cite one recent signal. If unclear, state 'Challenges not publicly available yet.'",
        category: "insights",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Why does {company.name} need {sellingSolutionsFor}? Use 50-80 words. Tie to one goal/challenge. If unclear, state 'Need not verified yet.'",
        category: "sales",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "{company.name} CEO: name, tenure, one key role, one focus. Use 30-50 words. If unknown, state 'CEO info not public yet.'",
        category: "people",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Email to {company.name} CEO: pitch {sellingSolutionsFor} from {salesRepAt}. Mention one goal, two benefits. 60-80 words total. Call to action.",
        category: "sales",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
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
      },
      {
        id: "biggest_goal_2025",
        title: "Biggest 2025 Goal",
        prompt:
          "{company.name}'s top goal for 2025. Cite source. 20-40 words. If unknown, state 'Goal not public yet.'",
        category: "strategy",
        orderIndex: 2,
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "industry_challenges",
        title: "Industry Challenges",
        prompt:
          "3 industry challenges for {company.name}. 10-20 words each. Cite one signal. If unclear, state 'Challenges not specified.'",
        category: "insights",
        orderIndex: 3,
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need_2",
        title: "Solution Need",
        prompt:
          "Why {company.name} needs {sellingSolutionsFor}? 40-60 words. Two benefits. If unclear, state 'Need not verified.'",
        category: "sales",
        orderIndex: 4,
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "top_competitors",
        title: "Top Competitors",
        prompt:
          "List 3-5 competitors of {company.name}. One short reason each. If unknown, state 'Competitors not public.'",
        category: "market",
        orderIndex: 5,
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "holding_company",
        title: "Ownership/Funding",
        prompt:
          "{company.name} ownership: holding company? Key investors? 30-50 words. If private, state 'Ownership not public.'",
        category: "financial",
        orderIndex: 6,
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info_2",
        title: "CEO Information",
        prompt:
          "{company.name} CEO: name, tenure, one achievement, one priority. 30-50 words. If unknown, state 'CEO info not public.'",
        category: "people",
        orderIndex: 7,
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "cold_call_scripts",
        title: "Cold Call Scripts",
        prompt:
          "Two cold-call openers for {company.name} CEO about {sellingSolutionsFor}. Each 2 sentences. Reference one insight. End with question.",
        category: "sales",
        orderIndex: 8,
        order: 9,
        defaultSize: { w: 4, h: 2 },
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

