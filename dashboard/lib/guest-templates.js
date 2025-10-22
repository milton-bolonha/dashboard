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
 *
 * ✅ CONTEXTO CORRETO (do onboarding):
 * - {sales_rep_company} = Empresa do vendedor (ex: "Acme Corp")
 * - {user_solution} = O que vende (ex: "AI Sales Tools")
 * - {target_company} = Empresa a pesquisar (ex: Tesla, SpaceX, etc) ← VARIÁVEL!
 * - {target_url} = URL da empresa pesquisada (ex: tesla.com)
 * - {research_focus} = Foco (ex: "Automotive Industry")
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
        id: "company_description",
        title: "What They Do",
        prompt:
          "Succinctly describe what {target_company} does. Provide a clear, concise overview of their business, products, and services.",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt:
          "How does {target_company} generate revenue? Explain their business model, revenue streams, and monetization strategies.",
        category: "financial",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "international_offices",
        title: "International Presence",
        prompt:
          "Do {target_company} have international offices? List their global locations, international operations, and expansion strategy.",
        category: "market",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "What are {target_company}'s business goals or priorities for 2025? Provide 3 goals and provide sources and links to articles or quotes from the company for each goal. Articles need to be dated later than January 2025. Provide each answer in detail.",
        category: "strategy",
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "What are the business challenges for {target_company} this calendar year? Identify key obstacles, market pressures, and operational difficulties they are facing.",
        category: "insights",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Why may {target_company} be in need of {user_solution}? Analyze their current situation and explain how our solutions could address their specific needs and challenges.",
        category: "sales",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "Who is the CEO of {target_company}? Provide their name, background, tenure, and any relevant information about their leadership style and priorities.",
        category: "people",
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Based on what we know about {target_company} from the other prompts, write a sales email to their CEO pitching {user_solution}. Needs to make reference to their business goals. Must include bullet points. Maximum 120 words.",
        category: "sales",
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },
    ],
  },

  // Template 2: Dashboard Template 2 (9 tiles específicos)
  template_2: {
    id: "template_2",
    name: "Dashboard Template 2",
    description: "9 tiles específicos para análise de vendas",
    icon: "🔍",

    tiles: [
      {
        id: "company_description_2",
        title: "What They Do",
        prompt:
          "Succinctly describe what {target_company} does. Provide a clear, concise overview of their business, products, and services.",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model_2",
        title: "Revenue Generation",
        prompt:
          "How does {target_company} generate revenue? Explain their business model, revenue streams, and monetization strategies.",
        category: "financial",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "biggest_goal_2025",
        title: "Biggest 2025 Goal",
        prompt:
          "What is {target_company}'s biggest business goal or priority for 2025 and beyond? Provide 1 goal and provide sources and links to articles or quotes from the company for goal. Articles need to be dated later than January 2025. Provide each answer in detail. Max 75 words.",
        category: "strategy",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "industry_challenges",
        title: "Industry Challenges",
        prompt:
          "What are the challenges facing {target_company}'s industry during this calendar year? Identify key industry-wide obstacles, market pressures, and sector-specific difficulties.",
        category: "insights",
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need_2",
        title: "Solution Need",
        prompt:
          "Why may {target_company} be in need of {user_solution}? Analyze their current situation and explain how our solutions could address their specific needs and challenges.",
        category: "sales",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "top_competitors",
        title: "Top 10 Competitors",
        prompt:
          "Who are {target_company}'s 10 closest competitors? List them with brief descriptions of how they compete in the market.",
        category: "market",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "holding_company",
        title: "Holding Company",
        prompt:
          "Do {target_company} have a holding company or investment firm that owns them? Identify their parent company, investors, and ownership structure.",
        category: "financial",
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info_2",
        title: "CEO Information",
        prompt:
          "Who is the CEO of {target_company}? Provide their name, background, tenure, and any relevant information about their leadership style and priorities.",
        category: "people",
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "cold_call_scripts",
        title: "Cold Call Scripts",
        prompt:
          "Based on what we know about {target_company}, provide 2 cold call opening scripts I can use as a salesperson pitching {user_solution} to their CEO. The script needs to make reference to their business goals or business challenges.",
        category: "sales",
        order: 9,
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
 * ✅ CORRIGIDO: Variáveis do contexto do onboarding
 *
 * Onboarding captura:
 * - company: Empresa do vendedor (ex: "Acme Corp")
 * - solution: O que vende (ex: "AI Sales Tools")
 * - research: Empresa a pesquisar + foco (ex: "Tesla in Automotive")
 * - companyUrl: URL da empresa A PESQUISAR (ex: "tesla.com")
 */
export function processPromptVariables(prompt, context) {
  // Validar se context.researchTarget existe
  if (!context.researchTarget) {
    console.error("❌ context.researchTarget is undefined:", context);
    throw new Error("researchTarget is required in context");
  }

  // Parse researchTarget (pode ser "Tesla" ou "Tesla in Automotive")
  const targetCompany = context.researchTarget.split(" in ")[0].trim();
  const researchFocus = context.researchTarget.includes(" in ")
    ? context.researchTarget.split(" in ")[1].trim()
    : context.researchTarget;

  return prompt
    .replace(/{sales_rep_company}/g, context.company) // Empresa do vendedor
    .replace(/{user_solution}/g, context.solution) // O que vende
    .replace(/{target_company}/g, targetCompany) // Empresa a pesquisar
    .replace(/{target_url}/g, context.researchWebsite) // URL da empresa pesquisada
    .replace(/{research_focus}/g, researchFocus); // Foco da pesquisa
}
