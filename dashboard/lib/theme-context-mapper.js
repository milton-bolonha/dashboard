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
 */
export function buildLegacyContext(promptContext, theme) {
  // Verificar se é Sales Assistant (usa formato legado)
  if (theme.id === "sales-assistant") {
    return {
      company: promptContext.salesRepAt || "",
      companyWebsite: promptContext.companyWebsite || "",
      solution: promptContext.sellingSolutionsFor || "",
      researchTarget: promptContext.company?.name || promptContext.target || "",
      researchWebsite:
        promptContext.company?.website || promptContext.targetWebsite || "",
    };
  }

  // Para outros temas, retornar estrutura genérica
  return promptContext;
}
