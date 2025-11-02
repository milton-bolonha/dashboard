let registeredRunner = null;

export function setDeckEngineRunner(runner) {
  registeredRunner = runner;
}

export function getDeckEngineRunner() {
  return registeredRunner;
}

// Tentativa opcional de auto-registro (não falha se não existir)
async function tryAutoRegister() {
  try {
    // Caso exista um runner exportado globalmente em runtime (injeção do deckEngine)
    if (
      globalThis.__deckEngineRunner &&
      typeof globalThis.__deckEngineRunner.runJob === "function"
    ) {
      setDeckEngineRunner(globalThis.__deckEngineRunner);
      return;
    }
    // Espaço para tentativa de import dinâmico futura se for viável no ambiente
    // e.g.: const mod = await import("../../../../deckEngine/index.js"); setDeckEngineRunner(mod.default)
  } catch {}
}

tryAutoRegister();
