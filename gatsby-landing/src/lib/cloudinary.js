/**
 * Retorna a URL de imagem diretamente.
 * As URLs agora vêm completas da API, não precisamos construir nada.
 * @param {string} imageUrl A URL completa da imagem.
 * @param {object} options Opções não utilizadas (mantidas para compatibilidade).
 * @returns {string|null} A URL da imagem ou null se inválida.
 */
export function buildCloudinaryUrl(imageUrl, options = {}) {
  console.log("[DEBUG] buildCloudinaryUrl: Recebido imageUrl =", imageUrl);
  console.log("[DEBUG] buildCloudinaryUrl: options =", options);

  if (!imageUrl) {
    console.log(
      "[DEBUG] buildCloudinaryUrl: imageUrl é null/undefined, retornando null"
    );
    return null;
  }

  // A API agora retorna URLs completas, apenas retornamos diretamente
  console.log(
    "[DEBUG] buildCloudinaryUrl: Retornando imageUrl diretamente =",
    imageUrl
  );
  return imageUrl;
}
