/**
 * Retorna a URL de imagem diretamente.
 * As URLs agora vêm completas da API, não precisamos construir nada.
 * @param {string} imageUrl A URL completa da imagem.
 * @param {object} options Opções não utilizadas (mantidas para compatibilidade).
 * @returns {string|null} A URL da imagem ou null se inválida.
 */
export function buildCloudinaryUrl(imageUrl, options = {}) {
  if (!imageUrl) {
    return null;
  }

  // A API agora retorna URLs completas, apenas retornamos diretamente
  return imageUrl;
}
