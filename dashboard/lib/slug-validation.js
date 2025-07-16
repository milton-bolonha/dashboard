/**
 * Utilitários para validação e geração de slugs
 */

// Palavras reservadas que não podem ser usadas como slugs
const RESERVED_WORDS = [
  // Rotas do sistema
  "api",
  "admin",
  "dashboard",
  "public",
  "private",
  "auth",
  "login",
  "logout",
  "signin",
  "signup",
  "profile",
  "settings",
  "billing",
  "workspace",
  "workspaces",

  // Rotas de conteúdo
  "sections",
  "items",
  "content",
  "types",
  "addons",
  "features",
  "analytics",

  // Rotas de API
  "v1",
  "v2",
  "beta",
  "test",
  "debug",
  "health",
  "status",
  "metrics",

  // Palavras comuns que podem causar conflitos
  "blog",
  "posts",
  "news",
  "articles",
  "pages",
  "home",
  "about",
  "contact",
  "help",
  "support",
  "docs",
  "documentation",
  "api-docs",
  "swagger",

  // Extensões de arquivo
  "js",
  "css",
  "html",
  "xml",
  "json",
  "pdf",
  "txt",
  "doc",
  "xls",

  // Termos técnicos
  "www",
  "mail",
  "ftp",
  "smtp",
  "pop",
  "imap",
  "dns",
  "ssl",
  "tls",
];

// Caracteres permitidos em slugs
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Valida se um slug é válido
 * @param {string} slug - O slug a ser validado
 * @param {Object} options - Opções de validação
 * @returns {Object} Resultado da validação
 */
export function validateSlug(slug, options = {}) {
  const {
    minLength = 3,
    maxLength = 50,
    allowReservedWords = false,
    checkPattern = true,
  } = options;

  const errors = [];

  // Verificar se é string
  if (typeof slug !== "string") {
    errors.push("Slug deve ser uma string");
    return { isValid: false, errors };
  }

  // Verificar comprimento
  if (slug.length < minLength) {
    errors.push(`Slug deve ter pelo menos ${minLength} caracteres`);
  }

  if (slug.length > maxLength) {
    errors.push(`Slug deve ter no máximo ${maxLength} caracteres`);
  }

  // Verificar padrão (apenas letras minúsculas, números e hífens)
  if (checkPattern && !SLUG_PATTERN.test(slug)) {
    errors.push("Slug deve conter apenas letras minúsculas, números e hífens");
  }

  // Verificar palavras reservadas
  if (!allowReservedWords && RESERVED_WORDS.includes(slug.toLowerCase())) {
    errors.push(
      `"${slug}" é uma palavra reservada e não pode ser usada como slug`
    );
  }

  // Verificar se não começa ou termina com hífen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    errors.push("Slug não pode começar ou terminar com hífen");
  }

  // Verificar se não tem hífens consecutivos
  if (slug.includes("--")) {
    errors.push("Slug não pode ter hífens consecutivos");
  }

  return {
    isValid: errors.length === 0,
    errors,
    slug: slug.toLowerCase(),
  };
}

/**
 * Gera um slug a partir de um texto
 * @param {string} text - O texto para gerar o slug
 * @param {Object} options - Opções de geração
 * @returns {string} O slug gerado
 */
export function generateSlug(text, options = {}) {
  const {
    maxLength = 50,
    allowReservedWords = false,
    separator = "-",
  } = options;

  if (!text || typeof text !== "string") {
    throw new Error("Texto deve ser uma string não vazia");
  }

  // Converter para minúsculas e remover acentos
  let slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, separator) // Substitui espaços por separador
    .replace(new RegExp(`${separator}+`, "g"), separator) // Remove separadores consecutivos
    .replace(new RegExp(`^${separator}|${separator}$`, "g"), ""); // Remove separadores no início/fim

  // Truncar se necessário
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Garantir que não termina com separador
    if (slug.endsWith(separator)) {
      slug = slug.slice(0, -1);
    }
  }

  // Verificar se é uma palavra reservada
  if (!allowReservedWords && RESERVED_WORDS.includes(slug)) {
    slug = `${slug}-content`;
  }

  return slug;
}

/**
 * Gera um slug único verificando no banco de dados
 * @param {string} baseSlug - O slug base
 * @param {string} workspaceId - ID do workspace
 * @param {Function} checkExists - Função para verificar se existe
 * @param {Object} options - Opções adicionais
 * @returns {Promise<string>} O slug único
 */
export async function generateUniqueSlug(
  baseSlug,
  workspaceId,
  checkExists,
  options = {}
) {
  const { maxAttempts = 10, separator = "-" } = options;

  // Validar slug base
  const validation = validateSlug(baseSlug);
  if (!validation.isValid) {
    throw new Error(`Slug inválido: ${validation.errors.join(", ")}`);
  }

  let slug = validation.slug;
  let attempt = 0;

  while (attempt < maxAttempts) {
    // Verificar se existe no workspace
    const exists = await checkExists(slug, workspaceId);

    if (!exists) {
      return slug;
    }

    // Tentar com sufixo numérico
    attempt++;
    slug = `${baseSlug}${separator}${attempt}`;
  }

  // Se não conseguir com números, usar timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}${separator}${timestamp}`;
}

/**
 * Verifica se um slug é único no workspace
 * @param {string} slug - O slug a verificar
 * @param {string} workspaceId - ID do workspace
 * @param {string} collection - Nome da collection
 * @param {string} excludeId - ID do documento a excluir (para updates)
 * @returns {Promise<boolean>} True se único, false se já existe
 */
export async function isSlugUnique(
  slug,
  workspaceId,
  collection,
  excludeId = null
) {
  const { db } = await import("@/lib/db");

  const query = {
    slug: slug.toLowerCase(),
    workspaceId: workspaceId,
  };

  // Excluir documento atual em caso de update
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await db.findOne(collection, query);
  return !existing;
}

/**
 * Sanitiza um slug removendo caracteres problemáticos
 * @param {string} slug - O slug a sanitizar
 * @returns {string} O slug sanitizado
 */
export function sanitizeSlug(slug) {
  if (!slug) return "";

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Lista todas as palavras reservadas
 * @returns {string[]} Array de palavras reservadas
 */
export function getReservedWords() {
  return [...RESERVED_WORDS];
}

/**
 * Verifica se uma palavra é reservada
 * @param {string} word - A palavra a verificar
 * @returns {boolean} True se reservada, false caso contrário
 */
export function isReservedWord(word) {
  return RESERVED_WORDS.includes(word.toLowerCase());
}
