/**
 * Helpers para manipular workspaces dinâmicos por tema
 */

export async function createDynamicWorkspace(theme, context) {
  const dynamicData = {};

  // Para cada entidade principal, criar entrada inicial
  // Se nenhuma entidade tem isPrimary, usar a primeira como principal
  const primaryEntities = theme.entities.filter((e) => e.isPrimary);
  const entitiesToInitialize =
    primaryEntities.length > 0 ? primaryEntities : [theme.entities[0]]; // Fallback para primeira entidade

  for (const entity of entitiesToInitialize) {
    const entityKey = `${entity.id}s`; // Ex: companies, books, projects
    dynamicData[entityKey] = [];
  }

  console.log(
    `🗂️ Entidades inicializadas para tema ${theme.id}:`,
    Object.keys(dynamicData)
  );

  // Mapear dados do form (context) para entidades
  for (const tag of theme.landingTags) {
    if (!context[tag.id]) continue;

    console.log(
      `🏷️ Processando tag ${tag.id} -> ${tag.mapToEntity}.${tag.mapToField}`
    );

    const entityKey = tag.mapToEntity.endsWith("s")
      ? tag.mapToEntity
      : `${tag.mapToEntity}s`;

    console.log(`📦 EntityKey gerado: ${entityKey} (de ${tag.mapToEntity})`);

    if (!dynamicData[entityKey]) {
      console.log(`➕ Criando nova entrada para ${entityKey}`);
      dynamicData[entityKey] = [];
    }

    // Criar primeira entidade com dados do form
    if (dynamicData[entityKey].length === 0) {
      console.log(
        `📝 Criando entidade ${entityKey} com campo ${tag.mapToField} = ${
          context[tag.id]
        }`
      );
      const entity = {
        [tag.mapToField]: context[tag.id],
        createdAt: new Date().toISOString(),
      };

      // Adicionar campos padrão da entidade
      const entityDef = theme.entities.find(
        (e) => e.id === tag.mapToEntity.replace("s", "")
      );
      if (entityDef) {
        for (const field of entityDef.fields) {
          if (!entity[field.id]) {
            entity[field.id] =
              field.type === "date" ? new Date().toISOString() : "";
          }
        }
      }

      dynamicData[entityKey].push(entity);
    }
  }

  console.log(
    `✅ DynamicData final para tema ${theme.id}:`,
    JSON.stringify(dynamicData, null, 2)
  );

  return dynamicData;
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
