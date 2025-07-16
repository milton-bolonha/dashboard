/**
 * 🎮 DeckEngine - Ponto de Entrada Principal
 *
 * Este arquivo serve como proxy para o core organizado,
 * mantendo compatibilidade total com todas as importações existentes.
 */

// Importar do core organizado
const DeckEngineApp = require("./core/index");

// Re-exportar tudo para manter compatibilidade
module.exports = DeckEngineApp;
module.exports.DeckEngine = DeckEngineApp.DeckEngine;
module.exports.DeckEngineApp = DeckEngineApp.DeckEngineApp;
module.exports.Utils = DeckEngineApp.Utils;
module.exports.createEngine = DeckEngineApp.createEngine;

// Manter mensagem de startup
if (process.env.NODE_ENV !== "test") {
  console.log(`
🎮 DeckEngine Loaded!
├─ Version: 2.1.0
├─ Environment: ${process.env.NODE_ENV || "development"}
├─ Architecture: Unified Core
└─ Ready for action!

Example usage:
const engine = require('./index')();
  `);
}
