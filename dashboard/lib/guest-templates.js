// Templates de Dashboard para Guest Users (Sales Research)
// Templates = TILES DE AI PROMPTS predefinidos (OpenAI preenche automaticamente!)

/**
 * IMPORTANTE: Baseado no brief do cliente:
 *
 * "Automatically generate a company dashboard with preset AI prompt tiles
 * (e.g., competitors, funding, expansion, challenges)"
 *
 * Tile = Card com:
 * - Frente: Pergunta + Resposta da OpenAI
 * - Verso: Chatbox para follow-up
 * - Drag & drop, resize
 */

export const GUEST_DASHBOARD_TEMPLATES = {
  // Template 1: Essential Research (6 tiles básicos)
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "6 tiles essenciais de pesquisa de vendas",
    icon: "📊",

    // AI Tiles predefinidos
    // OpenAI vai PREENCHER automaticamente baseado no company context
    tiles: [
      {
        id: "company_overview",
        title: "Company Overview",
        prompt:
          "Provide a comprehensive overview of {company_name}. Include: industry, size, revenue, key products/services, and recent developments.",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 }, // Grid units
      },
      {
        id: "competitors",
        title: "Top Competitors",
        prompt:
          "Who are the main competitors of {company_name}? List the top 5 competitors with brief descriptions of how they compete.",
        category: "market",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "funding",
        title: "Funding & Financials",
        prompt:
          "What is the funding history and financial status of {company_name}? Include recent rounds, valuation, and key investors if available.",
        category: "financial",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "expansion_plans",
        title: "Expansion & Growth",
        prompt:
          "What are {company_name}'s recent expansion plans, new markets, or growth initiatives? Include any new products or geographic expansion.",
        category: "growth",
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "challenges",
        title: "Key Challenges",
        prompt:
          "What are the main challenges or pain points facing {company_name}? Consider market conditions, competition, and operational challenges.",
        category: "pain_points",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "recent_news",
        title: "Recent News",
        prompt:
          "What are the most recent and relevant news articles about {company_name}? Summarize the top 3-5 news items from the last 30 days.",
        category: "insights",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
    ],
  },

  // Template 2: Deep Research (12 tiles avançados)
  template_2: {
    id: "template_2",
    name: "Deep Research",
    description: "12 tiles completos para análise profunda",
    icon: "🔍",

    tiles: [
      // Basic Info
      {
        id: "company_profile",
        title: "Company Profile",
        prompt:
          "Generate a detailed company profile for {company_name}. Include: founding year, headquarters, CEO, employee count, annual revenue, and company mission.",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "products_services",
        title: "Products & Services",
        prompt:
          "What are the main products and services offered by {company_name}? Describe each and their market positioning.",
        category: "basic",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },

      // Market Analysis
      {
        id: "market_position",
        title: "Market Position",
        prompt:
          "What is {company_name}'s position in their market? Include market share, competitive advantages, and industry ranking.",
        category: "market",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "competitors_deep",
        title: "Competitive Landscape",
        prompt:
          "Analyze the competitive landscape for {company_name}. Who are their top 5 competitors and how do they compare in terms of market share, pricing, and product offerings?",
        category: "market",
        order: 4,
        defaultSize: { w: 4, h: 3 },
      },
      {
        id: "market_trends",
        title: "Market Trends",
        prompt:
          "What are the key market trends affecting {company_name}'s industry? How is the company positioned to take advantage of these trends?",
        category: "market",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },

      // Financial & Growth
      {
        id: "funding_history",
        title: "Funding History",
        prompt:
          "Detail the complete funding history of {company_name}. Include all rounds, investors, valuations, and dates.",
        category: "financial",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "growth_metrics",
        title: "Growth Metrics",
        prompt:
          "What are the key growth metrics for {company_name}? Include revenue growth, customer acquisition, market expansion, and employee growth.",
        category: "growth",
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "expansion_strategy",
        title: "Expansion Strategy",
        prompt:
          "What is {company_name}'s expansion strategy? Include new markets, products in development, and strategic partnerships.",
        category: "growth",
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },

      // Challenges & Opportunities
      {
        id: "pain_points",
        title: "Pain Points & Challenges",
        prompt:
          "What are the main pain points and challenges facing {company_name}? Consider operational, financial, and market challenges.",
        category: "pain_points",
        order: 9,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "sales_opportunities",
        title: "Sales Opportunities",
        prompt:
          "Based on {company_name}'s challenges and our solution ({user_solution}), what are the key sales opportunities? How can we help them?",
        category: "opportunities",
        order: 10,
        defaultSize: { w: 4, h: 3 },
      },

      // Recent Activity
      {
        id: "recent_news",
        title: "Recent News & Events",
        prompt:
          "What are the most recent news, events, and announcements from {company_name}? Focus on the last 60 days.",
        category: "insights",
        order: 11,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "decision_makers",
        title: "Key Decision Makers",
        prompt:
          "Who are the key decision makers at {company_name}? List executives and their roles, focusing on those relevant to {user_solution}.",
        category: "contacts",
        order: 12,
        defaultSize: { w: 4, h: 2 },
      },
    ],
  },
};

/**
 * Retorna um template específico
 */
export function getGuestTemplate(templateId) {
  return (
    GUEST_DASHBOARD_TEMPLATES[templateId] ||
    GUEST_DASHBOARD_TEMPLATES.template_1
  );
}

/**
 * Lista todos os templates disponíveis
 */
export function listGuestTemplates() {
  return Object.values(GUEST_DASHBOARD_TEMPLATES).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    tilesCount: t.tiles.length,
  }));
}

/**
 * Processa template variables em prompts
 * {company_name} → "Tesla"
 * {user_solution} → "AI Sales Tools"
 */
export function processPromptVariables(prompt, context) {
  return prompt
    .replace(/{company_name}/g, context.company)
    .replace(/{company_url}/g, context.companyUrl)
    .replace(/{user_solution}/g, context.solution)
    .replace(/{research_target}/g, context.research);
}
