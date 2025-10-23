/**
 * Cloudinary URL Utilities
 * Funções para gerar URLs do Cloudinary (lado cliente)
 */

/**
 * Gerar URL de imagem do Cloudinary
 * @param {string} publicId - ID público da imagem
 * @param {object} options - Opções de transformação
 */
export function buildUrl(publicId, options = {}) {
  if (!publicId) return null;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || cloudName === "demo") {
    // Fallback para desenvolvimento
    return `https://via.placeholder.com/300x200?text=${publicId}`;
  }

  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Transformações padrão
  const transformations = {
    quality: "auto",
    fetch_format: "auto",
    ...options,
  };

  // Converter transformações para string
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(",");

  return `${baseUrl}/${transformString}/${publicId}`;
}

/**
 * Gerar URL de thumbnail
 * @param {string} publicId - ID público da imagem
 * @param {number} width - Largura do thumbnail
 * @param {number} height - Altura do thumbnail
 */
export function buildThumbnailUrl(publicId, width = 150, height = 150) {
  return buildUrl(publicId, {
    width,
    height,
    crop: "fill",
    gravity: "auto",
  });
}

/**
 * Gerar URL de avatar
 * @param {string} publicId - ID público da imagem
 * @param {number} size - Tamanho do avatar
 */
export function buildAvatarUrl(publicId, size = 100) {
  return buildUrl(publicId, {
    width: size,
    height: size,
    crop: "fill",
    gravity: "face",
  });
}
