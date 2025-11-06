/**
 * Sistema de logging centralizado com controle de verbosidade
 * Permite reduzir logs repetitivos e focar em informações importantes
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const DEFAULT_LOG_LEVEL = process.env.LOG_LEVEL || "INFO";
const LOG_LEVEL_NUM = LOG_LEVELS[DEFAULT_LOG_LEVEL] ?? LOG_LEVELS.INFO;

// Configurações por contexto
const CONTEXT_CONFIG = {
  SSE: {
    maxFrequency: 5000, // Log máximo a cada 5s para eventos repetitivos
    enabled: true,
  },
  RUNNER: {
    maxFrequency: 1000, // Log máximo a cada 1s
    enabled: true,
  },
  DECKENGINE: {
    maxFrequency: 2000, // Log máximo a cada 2s
    enabled: true,
  },
};

// Throttle por contexto
const lastLogTime = new Map();

function shouldLog(context, message) {
  if (!CONTEXT_CONFIG[context]?.enabled) return false;

  const now = Date.now();
  const lastTime = lastLogTime.get(message) || 0;
  const maxFreq = CONTEXT_CONFIG[context].maxFrequency || 1000;

  if (now - lastTime > maxFreq) {
    lastLogTime.set(message, now);
    return true;
  }

  return false;
}

export const logger = {
  error: (context, message, data = {}) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.ERROR) {
      console.error(`[${context}] ❌ ${message}`, data);
    }
  },

  warn: (context, message, data = {}) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.WARN) {
      if (shouldLog(context, message)) {
        console.warn(`[${context}] ⚠️ ${message}`, data);
      }
    }
  },

  info: (context, message, data = {}) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.INFO) {
      // Logs de info sempre passam (não são repetitivos normalmente)
      console.log(`[${context}] ℹ️ ${message}`, data);
    }
  },

  debug: (context, message, data = {}) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.DEBUG) {
      if (shouldLog(context, message)) {
        console.debug(`[${context}] 🔍 ${message}`, data);
      }
    }
  },

  // Logs críticos sempre passam (sem throttle)
  critical: (context, message, data = {}) => {
    console.error(`[${context}] 🚨 CRITICAL: ${message}`, data);
  },
};

// ⭐ Funções de conveniência para compatibilidade com código existente
// Permitem uso direto: logDebug("message") ou logDebug("message", data)
// Contexto padrão é inferido do stack trace ou usa "APP" como fallback

/**
 * Função de log de debug
 * @param {string} message - Mensagem a ser logada
 * @param {any} [data] - Dados adicionais (opcional)
 */
export function logDebug(message, data) {
  const context = inferContext() || "APP";
  if (LOG_LEVEL_NUM >= LOG_LEVELS.DEBUG) {
    // Para funções de conveniência, não aplicamos throttle (são logs pontuais)
    if (data !== undefined) {
      console.debug(`[${context}] 🔍 ${message}`, data);
    } else {
      console.debug(`[${context}] 🔍 ${message}`);
    }
  }
}

/**
 * Função de log de erro
 * @param {string} message - Mensagem a ser logada
 * @param {any} [data] - Dados adicionais (opcional)
 */
export function logError(message, data) {
  const context = inferContext() || "APP";
  if (LOG_LEVEL_NUM >= LOG_LEVELS.ERROR) {
    if (data !== undefined) {
      console.error(`[${context}] ❌ ${message}`, data);
    } else {
      console.error(`[${context}] ❌ ${message}`);
    }
  }
}

/**
 * Função de log de warning
 * @param {string} message - Mensagem a ser logada
 * @param {any} [data] - Dados adicionais (opcional)
 */
export function logWarn(message, data) {
  const context = inferContext() || "APP";
  if (LOG_LEVEL_NUM >= LOG_LEVELS.WARN) {
    if (data !== undefined) {
      console.warn(`[${context}] ⚠️ ${message}`, data);
    } else {
      console.warn(`[${context}] ⚠️ ${message}`);
    }
  }
}

/**
 * Infere o contexto do log baseado no stack trace
 * Tenta identificar o arquivo que chamou a função de log
 * @returns {string|null} Nome do contexto ou null
 */
function inferContext() {
  try {
    const stack = new Error().stack;
    if (!stack) return null;

    const lines = stack.split("\n");
    // Pular as primeiras linhas (Error, inferContext, função de log)
    // Procurar pela primeira linha que não seja do logger
    for (let i = 3; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      if (!line) continue;

      // Extrair nome do arquivo do stack trace
      // Formato: "    at functionName (file:///path/to/file.js:line:col)"
      const match = line.match(/([^/\\]+)\.(js|jsx|ts|tsx)/);
      if (match) {
        const fileName = match[1];
        // Mapear nomes de arquivo para contextos conhecidos
        if (fileName.includes("auth")) return "AUTH";
        if (fileName.includes("route")) {
          // Tentar extrair o caminho da rota
          const routeMatch = line.match(/app\/api\/([^/]+)/);
          if (routeMatch) {
            return routeMatch[1].toUpperCase().replace(/-/g, "_");
          }
          return "API";
        }
        if (fileName.includes("access")) return "ACCESS";
        if (fileName.includes("content")) return "CONTENT";
        return fileName.toUpperCase().replace(/-/g, "_");
      }
    }
  } catch (e) {
    // Se houver erro ao inferir contexto, retornar null
  }
  return null;
}
