/**
 * ⚡ Sistema de Otimização Inteligente de Prompts
 *
 * Classifica tiles automaticamente por criticidade e otimiza parâmetros
 * para balancear velocidade, qualidade e custo
 */

// Profiles de otimização por criticidade
export const TILE_PROFILES = {
  CRITICAL_FAST: {
    name: "CRITICAL_FAST",
    maxTokens: 300, // MUDADO: era 400 (mais rápido)
    temperature: 0.3, // MUDADO: era 0.5 (mais determinístico)
    priority: 1,
    description: "Tiles críticos que precisam aparecer primeiro",
    systemPromptSuffix: "Be concise and direct. Maximum 3 short paragraphs.",
  },

  STANDARD: {
    name: "STANDARD",
    maxTokens: 500, // MUDADO: era 600
    temperature: 0.5, // MUDADO: era 0.7
    priority: 2,
    description: "Tiles normais com equilíbrio",
    systemPromptSuffix: "Provide detailed but focused answer.",
  },

  DETAILED: {
    name: "DETAILED",
    maxTokens: 700, // MUDADO: era 800
    temperature: 0.6, // MUDADO: era 0.7
    priority: 3,
    description: "Tiles que precisam ser completos",
    systemPromptSuffix: "Provide comprehensive analysis with examples.",
  },
};

// Palavras-chave para classificação automática
const FAST_KEYWORDS = ["what", "who", "describe", "list", "basic"];
const DETAILED_KEYWORDS = [
  "write",
  "script",
  "email",
  "analyze",
  "strategy",
  "generate",
];

/**
 * Classifica um tile automaticamente baseado em características
 */
export function classifyTileProfile(tile, position, totalTiles) {
  const { title, prompt, category } = tile;

  // Análise de posição (primeiros tiles são críticos)
  const isEarly = position <= 3;
  const isLate = position > 6;

  // Análise de palavras-chave no título
  const titleLower = title.toLowerCase();
  const hasFastKeyword = FAST_KEYWORDS.some((kw) => titleLower.includes(kw));
  const hasDetailedKeyword = DETAILED_KEYWORDS.some((kw) =>
    titleLower.includes(kw)
  );

  // Análise de categoria
  const isSalesOutput = ["sales", "outreach"].includes(category);

  // Análise de prompt
  const promptLower = prompt.toLowerCase();
  const isComplexPrompt =
    promptLower.includes("provide") &&
    (promptLower.includes("sources") || promptLower.includes("links"));

  // Decisão baseada em regras
  if (isEarly && hasFastKeyword && !isSalesOutput) {
    return TILE_PROFILES.CRITICAL_FAST;
  }

  if (isSalesOutput || hasDetailedKeyword || isComplexPrompt) {
    return TILE_PROFILES.DETAILED;
  }

  if (isLate && !hasDetailedKeyword) {
    return TILE_PROFILES.STANDARD;
  }

  // Default baseado em posição
  if (position <= 3) {
    return TILE_PROFILES.CRITICAL_FAST;
  }

  return TILE_PROFILES.STANDARD;
}

/**
 * Otimiza o system prompt baseado no profile
 */
export function optimizeSystemPrompt(context, profile) {
  const { company, companyWebsite, solution, researchTarget, researchWebsite } =
    context;

  if (profile === TILE_PROFILES.CRITICAL_FAST) {
    // Contexto mínimo para tiles rápidos
    return `Sales rep from ${company} selling ${solution}. Research ${researchTarget}.`;
  }

  if (profile === TILE_PROFILES.DETAILED) {
    // Contexto completo para tiles detalhados
    return `You are an expert sales research assistant helping sales professionals.

Context about the sales rep:
- Works at: ${company} (${companyWebsite})
- Sells: ${solution}
- Researching: ${researchTarget} (${researchWebsite})

Provide detailed, actionable insights focused on sales opportunities.
Format your answers in clear, well-structured markdown.
Be specific and data-driven when possible.`;
  }

  // Contexto padrão
  return `You are an expert sales research assistant.
Sales rep from ${company} selling ${solution}. Research ${researchTarget} for sales opportunities.
Provide actionable insights focused on ${solution} opportunities for ${researchTarget}.`;
}

/**
 * Aplica constraints de formato baseado no profile
 */
export function applyFormatConstraints(prompt, profile) {
  if (profile === TILE_PROFILES.CRITICAL_FAST) {
    return `${prompt}\n\nIMPORTANT: Be concise. Maximum 2-3 short paragraphs.`;
  }

  if (profile === TILE_PROFILES.STANDARD) {
    return `${prompt}\n\nProvide a focused answer with clear structure.`;
  }

  // DETAILED não precisa de constraint adicional
  return prompt;
}

/**
 * Otimiza um tile completo (prompt + parâmetros)
 */
export function optimizeTile(tile, position, totalTiles, context) {
  const profile = classifyTileProfile(tile, position, totalTiles);

  return {
    ...tile,
    optimizationProfile: profile.name,
    maxTokens: profile.maxTokens,
    temperature: profile.temperature,
    priority: profile.priority,
    optimizedSystemPrompt: optimizeSystemPrompt(context, profile),
    optimizedPrompt: applyFormatConstraints(tile.prompt, profile),
  };
}

/**
 * Otimiza múltiplos tiles
 */
export function optimizeTiles(tiles, context) {
  const totalTiles = tiles.length;

  return tiles.map((tile, index) =>
    optimizeTile(tile, index + 1, totalTiles, context)
  );
}

/**
 * Analisa e sugere otimizações para um conjunto de tiles
 */
export function analyzeTilesForOptimization(tiles) {
  const analysis = {
    criticalCount: 0,
    standardCount: 0,
    detailedCount: 0,
    totalTokensEstimate: 0,
    suggestions: [],
  };

  tiles.forEach((tile, index) => {
    const profile = classifyTileProfile(tile, index + 1, tiles.length);

    analysis.totalTokensEstimate += profile.maxTokens;

    if (profile === TILE_PROFILES.CRITICAL_FAST) {
      analysis.criticalCount++;
    } else if (profile === TILE_PROFILES.STANDARD) {
      analysis.standardCount++;
    } else {
      analysis.detailedCount++;
    }

    // Sugestões específicas
    if (tile.prompt.length > 500 && index <= 3) {
      analysis.suggestions.push({
        tileId: tile.id,
        tileTitle: tile.title,
        issue: "Prompt muito longo para tile crítico",
        suggestion: "Simplificar prompt ou dividir em tiles menores",
      });
    }
  });

  return analysis;
}
