/**
 * Sistema de Logger Centralizado
 *
 * Este módulo fornece uma função de log para depuração que pode ser ativada/desativada
 * globalmente através de uma variável de ambiente, evitando a poluição de logs
 * em produção.
 */

// A verificação é feita uma vez quando o módulo é carregado para eficiência.
const isDebugMode = process.env.DASH_DEBUG_MODE === "true";

/**
 * Faz o log de uma mensagem de depuração apenas se o modo de depuração estiver ativado.
 *
 * @param {string} message A mensagem principal a ser registrada.
 * @param  {...any} args Argumentos adicionais a serem registrados, similar ao console.log.
 */
export function logDebug(message, ...args) {
  if (isDebugMode) {
    // Usamos um prefixo para identificar facilmente os logs de depuração.
    const prefix = "[DEBUG]";
    if (args.length > 0) {
      console.log(prefix, message, ...args);
    } else {
      console.log(prefix, message);
    }
  }
}

/**
 * Faz o log de um aviso, independentemente do modo de depuração.
 * Útil para condições que não são erros, mas que devem ser notadas.
 * @param {string} message A mensagem de aviso.
 * @param  {...any} args Argumentos adicionais.
 */
export function logWarn(message, ...args) {
  const prefix = "[WARN]";
  if (args.length > 0) {
    console.warn(prefix, message, ...args);
  } else {
    console.warn(prefix, message);
  }
}

/**
 * Faz o log de um erro, independentemente do modo de depuração.
 * @param {string} message A mensagem de erro.
 * @param  {...any} args Argumentos adicionais.
 */
export function logError(message, ...args) {
  const prefix = "[ERROR]";
  if (args.length > 0) {
    console.error(prefix, message, ...args);
  } else {
    console.error(prefix, message);
  }
}
