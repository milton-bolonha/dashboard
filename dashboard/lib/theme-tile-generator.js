/**
 * Gerador genérico de tiles baseado em templates do tema
 */

import { generateTileWithOpenAI } from "./ai-tile-generator";
import { createTileDebugLogger } from "./tile-debug-logger";

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
    let entityKey = entityName.endsWith("s") ? entityName : `${entityName}s`;

    // ⭐ CORREÇÃO CRÍTICA: Corrigir companys -> companies
    if (entityKey === "companys") {
      entityKey = "companies";
    }

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
 * @param {number} existingTilesCount - Quantidade de tiles já existentes (preloaded)
 * @returns {Promise<Array>} - Array de tiles gerados
 */
export async function generateTilesFromThemeTemplates(
  theme,
  dynamicData,
  guestId,
  existingTilesCount = 0
) {
  const debugLogger = createTileDebugLogger(guestId, theme.id);

  debugLogger.tileGenerationStarted(theme.tileTemplates.length);
  console.log(
    `🎨 Gerando tiles para tema: ${theme.name} (${theme.tileTemplates.length} templates)`
  );
  console.log(`🔍 Tiles existentes: ${existingTilesCount}`);

  const tiles = [];
  const startTime = Date.now();

  // Pular os primeiros tiles se já existirem (preloaded)
  const templatesToProcess = theme.tileTemplates.slice(existingTilesCount);

  if (existingTilesCount > 0) {
    console.log(
      `⏭️ Pulando ${existingTilesCount} tiles preloaded, processando ${templatesToProcess.length} restantes`
    );
  }

  // ⭐ PERFORMANCE: Processar templates em sequência para evitar rate limiting
  for (let i = 0; i < templatesToProcess.length; i++) {
    const template = templatesToProcess[i];
    const templateStartTime = Date.now();

    try {
      // ⭐ DEBUG: Log do processamento
      debugLogger.tileProcessing(template.id, template.title, template.prompt);
      console.log(
        `📋 Processando template ${i + 1}/${templatesToProcess.length}: ${
          template.title
        }`
      );

      // ⭐ EDGE CASE: Validar se template tem dados necessários
      if (!template.prompt || !template.title) {
        console.warn(`⚠️ Template ${template.id} inválido, pulando...`);
        continue;
      }

      // ⭐ VALIDATION: Validar variáveis antes de processar
      const validation = validateTemplateVariables(
        template.prompt,
        dynamicData
      );

      if (!validation.valid) {
        console.warn(
          `⚠️ Variáveis faltando no template ${template.id}:`,
          validation.missing
        );

        // ⭐ EDGE CASE: Se muitas variáveis estão faltando, pular template
        if (validation.missing.length > 3) {
          console.warn(
            `⚠️ Muitas variáveis faltando (${validation.missing.length}), pulando template ${template.id}`
          );
          continue;
        }
        // Continuar mesmo com algumas variáveis faltando
      }

      // ⭐ PROCESSING: Processar variáveis com error handling
      let processedPrompt;
      try {
        processedPrompt = processTemplateVariables(
          template.prompt,
          dynamicData
        );
      } catch (processError) {
        console.error(
          `❌ Erro ao processar variáveis do template ${template.id}:`,
          processError
        );
        // Usar prompt original como fallback
        processedPrompt = template.prompt;
      }

      console.log(`📝 Prompt processado:`, processedPrompt.substring(0, 100));

      // ⭐ EDGE CASE: Verificar se prompt processado não está vazio
      if (!processedPrompt.trim()) {
        console.warn(
          `⚠️ Prompt processado vazio para template ${template.id}, pulando...`
        );
        continue;
      }

      // ⭐ CONTEXT: Extrair dados da entidade principal com fallbacks
      const primaryEntityData = getPrimaryEntityData(theme, dynamicData);
      const entityName =
        primaryEntityData?.name || primaryEntityData?.title || "Unknown";
      const entityWebsite = primaryEntityData?.website || "";

      // ⭐ THEME CONTEXT: Criar contexto do tema para OpenAI
      const themeContext = {
        themeId: theme.id,
        themeName: theme.name,
        primaryEntity: primaryEntityData,
      };

      // ⭐ OPENAI: Gerar tile com timeout e retry logic
      let tileResult;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          tileResult = await generateTileWithOpenAI(
            processedPrompt,
            entityName,
            entityWebsite,
            themeContext
          );
          break; // Sucesso, sair do loop
        } catch (openaiError) {
          retryCount++;

          // ⭐ ERROR HANDLING: Diferentes tipos de erro da OpenAI
          if (openaiError.message.includes("rate limit")) {
            console.warn(
              `⚠️ Rate limit atingido, aguardando ${
                retryCount * 2
              }s antes de tentar novamente...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryCount * 2000)
            );
          } else if (openaiError.message.includes("timeout")) {
            console.warn(
              `⚠️ Timeout na geração, tentativa ${retryCount}/${maxRetries + 1}`
            );
          } else {
            console.error(
              `❌ Erro na geração (tentativa ${retryCount}/${maxRetries + 1}):`,
              openaiError.message
            );
          }

          if (retryCount > maxRetries) {
            throw openaiError; // Re-throw após esgotar tentativas
          }
        }
      }

      // ⭐ EDGE CASE: Verificar se tileResult é válido
      if (!tileResult || !tileResult.answer) {
        console.warn(
          `⚠️ Resposta inválida da OpenAI para template ${template.id}, pulando...`
        );
        continue;
      }

      // ⭐ EXCERPT: Gerar excerpt com sanitização
      let excerpt;
      try {
        const cleanAnswer = tileResult.answer.replace(/\n/g, " ").trim();
        excerpt = cleanAnswer.substring(0, 150);
        if (cleanAnswer.length > 150) {
          excerpt += "...";
        }
      } catch (excerptError) {
        console.warn(
          `⚠️ Erro ao gerar excerpt para template ${template.id}:`,
          excerptError
        );
        excerpt = "Resposta gerada com sucesso";
      }

      // ⭐ TILE CREATION: Criar objeto tile com validação
      const tile = {
        id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: template.title || "Tile sem título",
        content: tileResult.answer,
        excerpt: excerpt,
        question: template.prompt,
        category: template.category || "general",
        order: template.order || i, // Usar índice como ordem se não especificado
        createdAt: new Date().toISOString(),
        generated_by: "theme_template",
        template_id: template.id,
        metrics: tileResult.metrics || null,
        // ⭐ DEBUG: Adicionar informações de debug
        debug: {
          processedPrompt: processedPrompt.substring(0, 100),
          entityName,
          entityWebsite,
          retryCount,
        },
      };

      tiles.push(tile);

      const templateDuration = Date.now() - templateStartTime;
      debugLogger.tileGenerated(template.id, tile.id, templateDuration);
      console.log(`✅ Tile gerado: ${template.title} (${templateDuration}ms)`);

      // ⭐ PERFORMANCE: Rate limiting entre tiles (1 segundo)
      if (i < templatesToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      // ⭐ ERROR HANDLING: Log detalhado do erro
      debugLogger.error("tile_generation", error, {
        templateId: template.id,
        templateTitle: template.title,
        templateIndex: i,
        totalTemplates: templatesToProcess.length,
      });

      console.error(
        `❌ Erro ao gerar tile ${template.title} (${i + 1}/${
          templatesToProcess.length
        }):`,
        error
      );

      // ⭐ EDGE CASE: Se for erro crítico, parar geração
      if (
        error.message.includes("quota exceeded") ||
        error.message.includes("billing")
      ) {
        console.error(
          "❌ Erro crítico de billing/quota, parando geração de tiles"
        );
        break;
      }

      // Continuar com próximo tile para outros erros
    }
  }

  const totalDuration = Date.now() - startTime;
  debugLogger.tileGenerationCompleted(tiles.length, totalDuration);
  console.log(
    `✅ Total de tiles gerados: ${tiles.length}/${theme.tileTemplates.length}`
  );
  console.log(`⏱️ Duração total: ${totalDuration}ms`);

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

  let entityKey = `${primaryEntity.id}s`;

  // ⭐ CORREÇÃO CRÍTICA: Corrigir companys -> companies
  if (entityKey === "companys") {
    entityKey = "companies";
  }

  const entities = dynamicData[entityKey];

  if (!entities || entities.length === 0) {
    console.warn(`⚠️ Nenhuma entidade encontrada em ${entityKey}`);
    return null;
  }

  return entities[0];
}
