/**
 * Helpers para manipular workspaces dinâmicos por tema
 */

import { mapContextToEntities } from "./theme-context-mapper";
import { v4 as uuidv4 } from "uuid";

export async function createDynamicWorkspace(theme, context) {
  try {
    console.log(
      "🏗️ [dynamic-workspace] Iniciando criação com o tema:",
      theme.id
    );
    console.log("  Input Context:", context);

    const { entities: entityMappings, workspace: workspaceMappings } =
      mapContextToEntities(theme, context);

    console.log("  ✅ Mapeamento concluído:", {
      entityMappings,
      workspaceMappings,
    });

    const timestamp = new Date().toISOString();
    const dynamicData = {
      // Inicializa todas as entidades definidas no tema para garantir que existam
      ...theme.entities.reduce((acc, entity) => {
        const entityKey = `${entity.id}s`.replace("companys", "companies");
        acc[entityKey] = [];
        return acc;
      }, {}),
    };

    const workspaceData = {};

    // Processa as entidades mapeadas (ex: companies)
    for (const entityKey in entityMappings) {
      const entityData = entityMappings[entityKey];
      const newEntity = {
        id: `${entityKey.slice(0, -1)}_${Date.now()}`,
        ...entityData,
        createdAt: timestamp,
        tiles: [],
        tiles_status: "pending",
        tiles_to_generate: 0,
        description: "",
      };
      if (!dynamicData[entityKey]) {
        dynamicData[entityKey] = [];
      }
      dynamicData[entityKey].push(newEntity);
    }

    // Processa os dados do workspace mapeados (ex: sellingSolutionsFor)
    const newWorkspace = {
      id: `workpace_${Date.now()}`,
      ...workspaceMappings,
      createdAt: timestamp,
      tiles: [],
      tiles_status: "pending",
      tiles_to_generate: 0,
    };

    // A estrutura original armazena os dados do workspace em um array
    // chamado 'workspace'. Vamos manter esse padrão.
    workspaceData.workspace = [newWorkspace];

    console.log("  ✅ Estruturas de dados finais geradas.");

    return {
      workspaceData: { ...dynamicData, ...workspaceData },
      dynamicData: dynamicData, // Retorna separadamente para referência, se necessário
      themeSnapshot: theme,
    };
  } catch (error) {
    console.error(
      "❌ [dynamic-workspace] Erro fatal durante a criação do workspace:",
      error
    );
    // Lança o erro para que a API que o chamou possa tratá-lo
    throw new Error(`Failed to create dynamic workspace: ${error.message}`);
  }
}

export function getEntityFromTheme(theme, entityId) {
  return theme.entities.find((e) => e.id === entityId);
}

export function processTemplateVariables(template, context, entityData) {
  let processed = template;

  // Substituir variáveis {entity.field}
  const regex = /\{(\w+)\.(\w+)\}/g;
  processed = processed.replace(regex, (match, entityName, fieldName) => {
    if (entityData[entityName] && entityData[entityName][fieldName]) {
      return entityData[entityName][fieldName];
    }
    return match;
  });

  return processed;
}

export function countEntities(workspace) {
  const counts = {};

  for (const [entityKey, entities] of Object.entries(
    workspace.dynamicData || {}
  )) {
    if (Array.isArray(entities)) {
      counts[entityKey] = entities.length;
    }
  }

  return counts;
}
