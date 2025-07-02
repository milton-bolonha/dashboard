/**
 * Helpers para Cloudinary
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Constrói URL de imagem do Cloudinary com transformações
 * @param {string} publicId - ID público da imagem
 * @param {object} options - Opções de transformação
 * @returns {string|null} URL da imagem ou null se inválido
 */
export function buildUrl(publicId, options = {}) {
  if (!publicId || !CLOUD_NAME) return null;

  const {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
    gravity = "auto",
    ...otherOptions
  } = options;

  let transformations = [];

  // Transformations básicas
  if (width || height) {
    let sizeTransform = [];
    if (crop) sizeTransform.push(`c_${crop}`);
    if (width) sizeTransform.push(`w_${width}`);
    if (height) sizeTransform.push(`h_${height}`);
    if (gravity && crop === "fill") sizeTransform.push(`g_${gravity}`);
    transformations.push(sizeTransform.join(","));
  }

  // Qualidade e formato
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  // Outras transformações customizadas
  Object.entries(otherOptions).forEach(([key, value]) => {
    if (value !== undefined) {
      transformations.push(`${key}_${value}`);
    }
  });

  const transformString =
    transformations.length > 0 ? `/${transformations.join("/")}` : "";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload${transformString}/${publicId}`;
}

/**
 * Gera diferentes tamanhos de uma imagem
 * @param {string} publicId
 * @returns {object} URLs para diferentes tamanhos
 */
export function getImageSizes(publicId) {
  if (!publicId) return {};

  return {
    thumbnail: buildUrl(publicId, { width: 100, height: 100, crop: "fill" }),
    small: buildUrl(publicId, { width: 300, height: 200, crop: "fill" }),
    medium: buildUrl(publicId, { width: 600, height: 400, crop: "fill" }),
    large: buildUrl(publicId, { width: 1200, height: 800, crop: "fill" }),
    original: buildUrl(publicId),
  };
}

/**
 * Extrai informações de um public_id
 * @param {string} publicId
 * @returns {object} Informações extraídas
 */
export function parsePublicId(publicId) {
  if (!publicId) return {};

  const parts = publicId.split("/");
  const filename = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join("/");

  return {
    folder,
    filename,
    extension: filename.split(".").pop(),
    nameWithoutExtension: filename.split(".").slice(0, -1).join("."),
  };
}

/**
 * Valida se um public_id é válido
 * @param {string} publicId
 * @returns {boolean}
 */
export function isValidPublicId(publicId) {
  if (!publicId || typeof publicId !== "string") return false;

  // Regex básico para validar formato do public_id
  const validFormat = /^[a-zA-Z0-9_\-\/]+$/;
  return validFormat.test(publicId) && publicId.length > 0;
}

/**
 * Gera URL para deletar imagem (uso interno)
 * @param {string} publicId
 * @returns {string}
 */
export function getDeleteUrl(publicId) {
  // Esta função seria usada em um endpoint server-side
  // para deletar imagens órfãs
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;
}

export default {
  buildUrl,
  getImageSizes,
  parsePublicId,
  isValidPublicId,
  getDeleteUrl,
};
