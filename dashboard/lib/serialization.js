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
