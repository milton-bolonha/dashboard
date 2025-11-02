/**
 * Theme Context Mapper
 * Mapeia dados da entidade e context para variáveis de prompt
 * Suporta qualquer tema dinamicamente (Sales Assistant, Book Creator, etc.)
 */

/**
 * Constrói um contexto programático baseado no tema e entidade
 *
 * @param {Object} theme - Tema completo (de base-themes.js ou ThemeContext)
 * @param {Object} entity - Entidade atual (company, book, project, etc.)
 * @param {Object} originalContext - Contexto original do form da landing
 * @returns {Object} Contexto estruturado para uso em prompts
 *
 * Exemplos:
 * - Sales Assistant: { company: {name, website}, salesRepAt, sellingSolutionsFor }
 * - Book Creator: { book: {title, genre, synopsis, targetAudience} }
 */
export function buildPromptContext(theme, entity, originalContext = {}) {
  const context = {};

  // 1. Adicionar dados da entidade primária
  const primaryEntity = theme.entities?.find((e) => e.isPrimary);

  if (primaryEntity && entity) {
    // Criar objeto para a entidade (ex: { book: {...} })
    context[primaryEntity.id] = {};

    // Copiar todos os campos da entidade para o contexto
    for (const field of primaryEntity.fields) {
      if (entity[field.id]) {
        context[primaryEntity.id][field.id] = entity[field.id];
      }
    }

    // Adicionar campos gerais (id, createdAt, etc.)
    if (entity.id) context[primaryEntity.id].id = entity.id;
    if (entity.createdAt)
      context[primaryEntity.id].createdAt = entity.createdAt;
  }

  // 2. Adicionar dados do originalContext (do form da landing)
  // Mapear usando landingTags.mapToEntity
  for (const tag of theme.landingTags || []) {
    if (!originalContext[tag.id]) continue;
    if (!tag.mapToEntity) continue;

    // Se mapToEntity é "workspace", adicionar no root do context
    if (tag.mapToEntity === "workspace") {
      context[tag.mapToField] = originalContext[tag.id];
    } else {
      // Senão, adicionar dentro da entidade correspondente
      // mapToEntity já indica qual entidade usar (ex: "company", "book", etc.)
      const entityId = tag.mapToEntity;

      // Se a entidade já existe no context, adicionar lá
      if (context[entityId]) {
        context[entityId][tag.mapToField] = originalContext[tag.id];
      } else {
        // Senão, criar nova entrada
        context[entityId] = {
          [tag.mapToField]: originalContext[tag.id],
        };
      }
    }
  }

  console.log(
    "🎯 Contexto gerado dinamicamente:",
    JSON.stringify(context, null, 2)
  );

  return context;
}

/**
 * Converte contexto dinâmico em formato legado (backward compatibility)
 * Para templates que ainda usam {target_company}, {user_solution}, etc.
 *
 * ⭐ CORREÇÃO: Normaliza objetos aninhados para strings planas
 */
export function buildLegacyContext(promptContext, theme) {
  // Helper para extrair valor seguro (string ou propriedade de objeto)
  const safeString = (value, defaultValue = "") => {
    if (!value) return defaultValue;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
      // Se for objeto, tentar extrair propriedades comuns
      return value.name || value.title || value.value || defaultValue;
    }
    return String(value);
  };

  // ⭐ CORREÇÃO ARQUITETURAL: Detectar Sales Assistant de forma robusta
  // Não usar "classic" como theme ID (não existe) - apenas detectar por estrutura

  // Método 1: Verificar theme ID real (sales-assistant é o único tema real para Sales)
  const isSalesAssistantById = theme?.id === "sales-assistant";

  // Método 2: Detectar por estrutura de dados (compatibilidade com código legado)
  // Se tem company/companies como entidade primária + campos workspace (salesRepAt, sellingSolutionsFor)
  const hasCompanyEntity = theme?.entities?.some(
    (e) => e.id === "company" && e.isPrimary
  );
  const hasSalesWorkspaceFields =
    promptContext.salesRepAt ||
    promptContext.sellingSolutionsFor ||
    (promptContext.company && typeof promptContext.company === "object");

  // Método 3: Detectar por estrutura do promptContext (fallback para código sem theme)
  const hasLegacyCompanyStructure =
    promptContext.company?.name ||
    promptContext.researchTarget ||
    promptContext.target;

  if (
    isSalesAssistantById ||
    (hasCompanyEntity && hasSalesWorkspaceFields) ||
    hasLegacyCompanyStructure
  ) {
    return {
      company: safeString(
        promptContext.company?.name ||
          promptContext.salesRepAt ||
          (typeof promptContext.company === "string"
            ? promptContext.company
            : "") ||
          ""
      ),
      companyWebsite: safeString(
        promptContext.company?.website || promptContext.companyWebsite || ""
      ),
      solution: safeString(
        promptContext.sellingSolutionsFor || promptContext.solution || ""
      ),
      researchTarget: safeString(
        promptContext.company?.name ||
          promptContext.target ||
          promptContext.researchTarget ||
          ""
      ),
      researchWebsite: safeString(
        promptContext.company?.website ||
          promptContext.targetWebsite ||
          promptContext.researchWebsite ||
          ""
      ),
    };
  }

  // Para outros temas, tentar extrair valores comuns
  // Buscar por entidade primária
  const primaryEntity = theme?.entities?.find((e) => e.isPrimary);
  if (primaryEntity && promptContext[primaryEntity.id]) {
    const entity = promptContext[primaryEntity.id];
    return {
      company: safeString(entity.name || entity.title || ""),
      companyWebsite: safeString(entity.website || entity.url || ""),
      solution: safeString(
        promptContext.sellingSolutionsFor || promptContext.solution || ""
      ),
      researchTarget: safeString(entity.name || entity.title || ""),
      researchWebsite: safeString(entity.website || entity.url || ""),
    };
  }

  // Fallback: retornar valores planos do contexto (se já estiverem no formato legado)
  return {
    company: safeString(promptContext.company),
    companyWebsite: safeString(promptContext.companyWebsite),
    solution: safeString(promptContext.solution),
    researchTarget: safeString(promptContext.researchTarget),
    researchWebsite: safeString(promptContext.researchWebsite),
  };
}
