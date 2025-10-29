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
    // Corrigir entity key para plural correto
    let entityKey = `${entity.id}s`; // Ex: company -> companys (incorreto)
    if (entityKey === "companys") {
      entityKey = "companies";
    }
    dynamicData[entityKey] = [];
  }

  console.log(
    `🗂️ Entidades inicializadas para tema ${theme.id}:`,
    Object.keys(dynamicData)
  );

  // Mapear dados do form (context) para entidades
  // Agrupar por entidade primeiro para criar uma só entidade com todos os campos
  const entityData = {};

  for (const tag of theme.landingTags) {
    if (!context[tag.id]) continue;
    if (!tag.mapToEntity) continue;

    const entityId = tag.mapToEntity.replace("s", ""); // "books" -> "book"
    let entityKey = tag.mapToEntity; // "books" (já está correto)

    // ⭐ CORREÇÃO: Garantir que o entityKey seja o plural correto
    if (entityKey === "companys") {
      entityKey = "companies";
    }

    if (!entityData[entityKey]) {
      entityData[entityKey] = {};
    }

    console.log(
      `🏷️ Processando tag ${tag.id} -> ${tag.mapToEntity}.${tag.mapToField} = ${
        context[tag.id]
      }`
    );

    entityData[entityKey][tag.mapToField] = context[tag.id];
  }

  // Agora criar as entidades com todos os campos
  for (const [entityKey, fields] of Object.entries(entityData)) {
    let entityId = entityKey.replace("s", "");

    // Correção para companies -> company (remove último 's')
    if (entityKey === "companies") {
      entityId = "company";
    } else if (entityId === "compani") {
      entityId = "company";
    }

    // Buscar definição da entidade no tema
    const entityDef = theme.entities.find((e) => e.id === entityId);

    if (!dynamicData[entityKey]) {
      dynamicData[entityKey] = [];
    }

    console.log(
      `📝 Criando entidade ${entityKey} com campos:`,
      Object.keys(fields)
    );

    const entity = {
      id: `${entityId}_${Date.now()}`,
      ...fields,
      createdAt: new Date().toISOString(),
      // ⭐ NOVO: Campos de geração de tiles
      tiles: [],
      tiles_status: "pending",
      tiles_to_generate: 0, // Será setado depois na API
    };

    // Adicionar campos padrão da entidade que não foram preenchidos
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
