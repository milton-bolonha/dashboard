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
  // Template 1: Essential Research (8 tiles básicos)
  template_1: {
    id: "template_1",
    name: "Essential Research",
    description: "8 tiles essenciais de pesquisa de vendas",
    icon: "📊",

    // AI Tiles predefinidos
    // OpenAI vai PREENCHER automaticamente baseado no company context
    tiles: [
      {
        id: "company_description",
        title: "What They Do",
        prompt:
          "Summarize what {company.name} does in three short bullet points (≤15 words each). Cover core offering, primary customers, and a differentiator. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model",
        title: "Revenue Generation",
        prompt:
          "In ≤120 words, outline how {company.name} earns revenue today. Cite main products/services, fee or subscription mechanics, and any marketplace or usage-based streams. If details are unclear, explain the most likely model and explicitly note remaining gaps.",
        category: "financial",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "international_offices",
        title: "International Presence",
        prompt:
          "Describe {company.name}'s geographic footprint in ≤90 words. Mention HQ, notable regional hubs, and any international offices, remote teams, or global service coverage. If locations are undisclosed, explain how the company currently serves international audiences.",
        category: "market",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_goals_2025",
        title: "2025 Business Goals",
        prompt:
          "List up to three current strategic priorities for {company.name} over the next 12 months. Reference recent product launches, press releases, investor updates, or leadership quotes—cite the source and year (e.g., 2024 Investor Letter). If no goals are public, explain the best inferred focus area.",
        category: "strategy",
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "business_challenges",
        title: "2025 Business Challenges",
        prompt:
          "Highlight up to three pressing challenges {company.name} faces this year. Mention market, operational, or competitive pressures and cite recent signals when available. If direct evidence is limited, infer from industry trends and clearly label the assumption.",
        category: "insights",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need",
        title: "Solution Need",
        prompt:
          "Explain in ≤120 words why {company.name} would benefit from {sellingSolutionsFor}. Tie pains or goals to concrete outcomes the solution provides. If specific data is missing, use a closest-fit assumption for companies of similar size and note it.",
        category: "sales",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info",
        title: "CEO Information",
        prompt:
          "Provide a concise profile of {company.name}'s CEO: name, tenure, notable prior roles, and one leadership focus. If the CEO is not public, cite the highest-ranking executive available and note the gap.",
        category: "people",
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "sales_email",
        title: "CEO Sales Email",
        prompt:
          "Write a 100-word email to the CEO of {company.name} pitching {sellingSolutionsFor} from {salesRepAt}. Reference one goal or challenge above, include two bullet-point benefits, and close with a clear call to discuss next steps.",
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
          "Summarize what {company.name} does in three short bullet points (≤15 words each). Cover offer, core customers, and a differentiator. If information is unavailable, state 'No verified public information available yet.'",
        category: "basic",
        order: 1,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "revenue_model_2",
        title: "Revenue Generation",
        prompt:
          "In ≤120 words, outline how {company.name} earns revenue today. Cite principal products/services, fee structures, and any recurring or usage-based income. Note remaining unknowns if data is incomplete.",
        category: "financial",
        order: 2,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "biggest_goal_2025",
        title: "Biggest 2025 Goal",
        prompt:
          "State {company.name}'s single most visible strategic goal for the coming year. Reference the latest credible source (press release, leadership quote, investor deck) and describe the goal in ≤75 words. If no explicit goal exists, provide the best inferred priority and label it as such.",
        category: "strategy",
        order: 3,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "industry_challenges",
        title: "Industry Challenges",
        prompt:
          "Identify up to three challenges impacting {company.name}'s industry this year. Mention market, regulatory, or competitive pressures and cite the latest supporting signal. If specific intel is missing, note the assumption and why it matters.",
        category: "insights",
        order: 4,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "solution_need_2",
        title: "Solution Need",
        prompt:
          "Explain in ≤120 words why {company.name} may need {sellingSolutionsFor}. Link pains or objectives to two concrete benefits and cite any supporting signals. If data is thin, ground the answer in similar companies' needs and note the assumption.",
        category: "sales",
        order: 5,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "top_competitors",
        title: "Top 10 Competitors",
        prompt:
          "List up to five of {company.name}'s closest competitors with one-line explanations of how each competes. If direct competitors are unclear, cite the nearest category alternatives and note the rationale.",
        category: "market",
        order: 6,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "holding_company",
        title: "Holding Company",
        prompt:
          "Does {company.name} report a holding company or controlling investors? Summarize ownership structure, major investors, and latest funding status. If not disclosed, note the company as independent and reference the most recent funding signal.",
        category: "financial",
        order: 7,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "ceo_info_2",
        title: "CEO Information",
        prompt:
          "Provide a concise profile of {company.name}'s CEO: name, tenure, notable achievements, and one leadership priority. If the CEO is undisclosed, highlight the most senior public executive and clarify the gap.",
        category: "people",
        order: 8,
        defaultSize: { w: 4, h: 2 },
      },
      {
        id: "cold_call_scripts",
        title: "Cold Call Scripts",
        prompt:
          "Based on the insights above, draft two 2-sentence cold-call openers pitching {sellingSolutionsFor} to {company.name}'s CEO. Reference a specific goal or challenge in each opener and end with an open question.",
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
 * Helper para garantir que valor seja sempre string
 */
function safeStringValue(value, defaultValue = "") {
  if (!value) return defaultValue;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    // Se for objeto, tentar extrair propriedades comuns
    return value.name || value.title || value.value || String(value);
  }
  return String(value);
}

/**
 * Processa template variables em prompts
 * ✅ ATUALIZADO: Suporta tanto formato legado quanto dinâmico
 * ⭐ CORREÇÃO: Garante que valores sempre sejam strings (evita [object Object])
 *
 * Formatos suportados:
 * - {variable} - Formato simples
 * - {entity.field} - Formato dinâmico (ex: {book.title}, {company.name})
 */
export function processPromptVariables(prompt, context) {
  console.log("🔧 processPromptVariables - prompt:", prompt);
  console.log(
    "🔧 processPromptVariables - context:",
    JSON.stringify(context, null, 2)
  );

  let processed = prompt;

  // 1. Processar variáveis com formatos especiais PRIMEIRO {entity.field || 'default'}
  // Isso precisa ser feito antes das variáveis simples para evitar conflitos
  const entityFieldWithDefaultRegex = /\{(\w+)\.(\w+)\s*\|\|\s*'([^']+)'\}/g;
  processed = processed.replace(
    entityFieldWithDefaultRegex,
    (match, entityName, fieldName, defaultValue) => {
      if (context[entityName] && context[entityName][fieldName]) {
        const value = safeStringValue(
          context[entityName][fieldName],
          defaultValue
        );
        console.log(`✅ Substituindo ${match} por "${value}"`);
        return value;
      }
      console.log(`⚠️ Usando default para ${match}: "${defaultValue}"`);
      return defaultValue;
    }
  );

  // 2. Processar variáveis dinâmicas {entity.field} (ex: {company.name}, {book.title})
  const entityFieldRegex = /\{(\w+)\.(\w+)\}/g;
  processed = processed.replace(
    entityFieldRegex,
    (match, entityName, fieldName) => {
      if (context[entityName] && context[entityName][fieldName]) {
        const value = safeStringValue(context[entityName][fieldName]);
        console.log(`✅ Substituindo ${match} por "${value}"`);
        return value;
      }
      console.warn(
        `⚠️ Variável não encontrada: ${match} - context[${entityName}] =`,
        context[entityName]
      );
      return match; // Manter original se não encontrar
    }
  );

  // 3. Processar variáveis simples {variable} (backward compatibility)
  const simpleRegex = /\{(\w+)\}/g;
  processed = processed.replace(simpleRegex, (match, varName) => {
    // Ignorar se já foi processado (formato entity.field)
    if (match.includes(".")) return match;

    if (context[varName]) {
      const value = safeStringValue(context[varName]);
      console.log(`✅ Substituindo ${match} por "${value}"`);
      return value;
    }
    return match;
  });

  console.log("🔧 processPromptVariables - resultado:", processed);

  return processed;
}
