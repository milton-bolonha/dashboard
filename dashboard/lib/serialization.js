/**
 * Formata um único documento do MongoDB para ser enviado como resposta da API.
 * Converte _id para id, remove o campo __v e outros campos privados.
 * @param {object} doc O documento do MongoDB.
 * @returns {object} O documento formatado.
 */
function formatDocument(doc) {
  if (!doc) return null;

  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

/**
 * Serializa dados do MongoDB para serem enviados em uma resposta de API.
 * Pode ser um único objeto ou um array de objetos.
 * @param {object|object[]} data O dado ou lista de dados a ser serializado.
 * @returns {object|object[]} O dado serializado.
 */
export function serialize(data) {
  if (Array.isArray(data)) {
    return data.map((item) =>
      formatDocument(item.toObject ? item.toObject() : item)
    );
  }

  if (data && typeof data === "object") {
    return formatDocument(data.toObject ? data.toObject() : data);
  }

  return data;
}

/**
 * Helper para serialização padronizada de objetos do MongoDB
 * Evita problemas de ObjectId vs String e formata datas corretamente
 */

export function serializeWorkspace(workspace) {
  if (!workspace) return null;

  return {
    ...workspace,
    _id: workspace._id?.toString(),
    createdAt: workspace.createdAt?.toISOString(),
    updatedAt: workspace.updatedAt?.toISOString(),
    lastActivity: workspace.lastActivity?.toISOString(),
  };
}

export function serializeContentType(contentType) {
  if (!contentType) return null;

  return {
    ...contentType,
    _id: contentType._id?.toString(),
    workspaceId: contentType.workspaceId?.toString(),
    createdAt: contentType.createdAt?.toISOString(),
    updatedAt: contentType.updatedAt?.toISOString(),
  };
}

export function serializeSection(section) {
  if (!section) return null;

  return {
    ...section,
    _id: section._id?.toString(),
    workspaceId: section.workspaceId?.toString(),
    contentTypeId: section.contentTypeId?.toString(),
    createdAt: section.createdAt?.toISOString(),
    updatedAt: section.updatedAt?.toISOString(),
  };
}

export function serializeItem(item) {
  if (!item) return null;

  return {
    ...item,
    _id: item._id?.toString(),
    workspaceId: item.workspaceId?.toString(),
    sectionId: item.sectionId?.toString(),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
    publishedAt: item.publishedAt?.toISOString(),
  };
}

/**
 * Serializar arrays de objetos
 */
export function serializeArray(array, serializer) {
  if (!Array.isArray(array)) return [];
  return array.map(serializer).filter(Boolean);
}
