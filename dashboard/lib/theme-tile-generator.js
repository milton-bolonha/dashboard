/**
 * Gerador genérico de tiles baseado em templates do tema
 */

import { generateTileWithOpenAI } from "./ai-tile-generator";

/**
 * Processa variáveis de template substituindo {entity.field} por valores reais
 * @param {string} template - Template com variáveis
 * @param {object} dynamicData - Dados dinâmicos do workspace
 * @returns {string} - Template processado
 */
export function processTemplateVariables(template, dynamicData) {
  let processed = template;

  // Substituir {entity.field} por valores reais
  const regex = /\{(\w+)\.(\w+)\}/g;
  processed = processed.replace(regex, (match, entityName, fieldName) => {
    // Tentar encontrar a entidade
    // Primeiro tentar o plural (companies, books, projects)
    const entityKey = `${entityName}s`;
    let entity = dynamicData[entityKey]?.[0];

    // Se não encontrou no plural, tentar singular (book, company, project)
    if (!entity) {
      entity = dynamicData[entityName]?.[0];
    }

    if (entity && entity[fieldName]) {
      console.log(`✅ Substituindo ${match} por "${entity[fieldName]}"`);
      return entity[fieldName];
    }

    // Tentar buscar em todas as entidades (útil para templates como {chapter.number})
    for (const [key, entities] of Object.entries(dynamicData)) {
      if (Array.isArray(entities) && entities.length > 0) {
        const foundEntity = entities.find((e) => e[fieldName]);
        if (foundEntity) {
          console.log(
            `✅ Substituindo ${match} por "${foundEntity[fieldName]}" (encontrado em ${key})`
          );
          return foundEntity[fieldName];
        }
      }
    }

    console.warn(`⚠️ Variável não encontrada: ${match}`);
    return match; // Manter variável se não encontrado
  });

  return processed;
}

/**
 * Valida que todas as variáveis do template existem em dynamicData
 * @param {string} template - Template com variáveis
 * @param {object} dynamicData - Dados dinâmicos
 * @returns {object} - { valid: boolean, missing: string[] }
 */
export function validateTemplateVariables(template, dynamicData) {
  const regex = /\{(\w+)\.(\w+)\}/g;
  const missing = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    const [, entityName, fieldName] = match;
    const entityKey = `${entityName}s`;
    const entity = dynamicData[entityKey]?.[0];

    if (!entity || !entity[fieldName]) {
      missing.push(match[0]);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gera tiles baseado nos templates do tema
 * @param {object} theme - Tema com tileTemplates
 * @param {object} dynamicData - Dados dinâmicos do workspace
 * @param {string} guestId - ID do guest workspace
 * @returns {Promise<Array>} - Array de tiles gerados
 */
export async function generateTilesFromThemeTemplates(
  theme,
  dynamicData,
  guestId
) {
  console.log(
    `🎨 Gerando tiles para tema: ${theme.name} (${theme.tileTemplates.length} templates)`
  );

  const tiles = [];

  for (const template of theme.tileTemplates) {
    try {
      console.log(`📋 Processando template: ${template.title}`);

      // Validar variáveis
      const validation = validateTemplateVariables(
        template.prompt,
        dynamicData
      );
      if (!validation.valid) {
        console.warn(
          `⚠️ Variáveis faltando no template ${template.id}:`,
          validation.missing
        );
        // Continuar mesmo com variáveis faltando
      }

      // Processar variáveis
      const processedPrompt = processTemplateVariables(
        template.prompt,
        dynamicData
      );

      console.log(`📝 Prompt processado:`, processedPrompt.substring(0, 100));

      // Gerar tile com OpenAI
      // Extrair nome e website da entidade principal para contexto
      const primaryEntityData = getPrimaryEntityData(theme, dynamicData);
      const entityName =
        primaryEntityData?.name || primaryEntityData?.title || "Unknown";
      const entityWebsite = primaryEntityData?.website || "";

      const tileResult = await generateTileWithOpenAI(
        processedPrompt,
        entityName,
        entityWebsite
      );

      const tile = {
        id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        content: tileResult.answer,
        excerpt: tileResult.excerpt,
        category: template.category || "general",
        order: template.order || 0,
        createdAt: new Date().toISOString(),
        generated_by: "theme_template",
        template_id: template.id,
      };

      tiles.push(tile);
      console.log(`✅ Tile gerado: ${template.title}`);
    } catch (error) {
      console.error(`❌ Erro ao gerar tile ${template.title}:`, error);
      // Continuar com próximo tile
    }
  }

  console.log(
    `✅ Total de tiles gerados: ${tiles.length}/${theme.tileTemplates.length}`
  );

  return tiles;
}

/**
 * Obtém os dados da entidade principal para processar templates
 * @param {object} theme - Tema
 * @param {object} dynamicData - Dados dinâmicos
 * @returns {object|null} - Primeira entidade principal
 */
export function getPrimaryEntityData(theme, dynamicData) {
  const primaryEntity = theme.entities.find((e) => e.isPrimary);
  if (!primaryEntity) {
    console.warn("⚠️ Nenhuma entidade principal encontrada no tema");
    return null;
  }

  const entityKey = `${primaryEntity.id}s`;
  const entities = dynamicData[entityKey];

  if (!entities || entities.length === 0) {
    console.warn(`⚠️ Nenhuma entidade encontrada em ${entityKey}`);
    return null;
  }

  return entities[0];
}
