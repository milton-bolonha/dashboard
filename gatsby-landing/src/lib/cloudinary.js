const CLOUDINARY_CLOUD_NAME = process.env.GATSBY_CLOUDINARY_CLOUD_NAME;

/**
 * Constrói uma URL de imagem de forma inteligente.
 * - Se o input já for uma URL completa (http, https, /), retorna-o diretamente.
 * - Se for um ID do Cloudinary, constrói a URL completa com transformações.
 * @param {string} imageIdentifier O ID público do Cloudinary ou uma URL completa.
 * @param {object} options Opções de transformação para o Cloudinary (ex: { width: 800 }).
 * @returns {string|null} A URL final da imagem ou null se o input for inválido.
 */
export function buildCloudinaryUrl(imageIdentifier, options = {}) {
  if (!imageIdentifier) {
    return null;
  }

  // Se já for uma URL completa ou um caminho relativo, retorna diretamente.
  if (imageIdentifier.startsWith("http") || imageIdentifier.startsWith("/")) {
    return imageIdentifier;
  }

  // Se não for uma URL, assume que é um ID do Cloudinary e continua.
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn(
      `[Cloudinary] A variável de ambiente GATSBY_CLOUDINARY_CLOUD_NAME não está definida. Não foi possível construir a URL para o ID: "${imageIdentifier}".`
    );
    return null;
  }

  // Mapeia opções para transformações do Cloudinary
  const transformations = [];
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  const transformationString = transformations.join(",");

  // Adiciona a string de transformação apenas se ela não estiver vazia
  const transformationPath = transformationString
    ? `${transformationString}/`
    : "";

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationPath}${imageIdentifier}`;
}
