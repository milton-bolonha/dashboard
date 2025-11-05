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
