/**
 * Teste simples para verificar se a conversão para ES modules funcionou
 */

import DeckEngineApp, { createEngine, Utils } from "./index.js";

console.log("🧪 Testando conversão para ES Modules...");

// Teste 1: Verificar se as importações funcionam
console.log("✅ Importações funcionando");

// Teste 2: Verificar se a classe principal pode ser instanciada
try {
  const engine = new DeckEngineApp();
  console.log("✅ DeckEngineApp pode ser instanciada");
} catch (error) {
  console.error("❌ Erro ao instanciar DeckEngineApp:", error.message);
}

// Teste 3: Verificar se a função convenience funciona
try {
  const engine2 = createEngine();
  console.log("✅ createEngine funciona");
} catch (error) {
  console.error("❌ Erro ao usar createEngine:", error.message);
}

// Teste 4: Verificar se Utils funciona
try {
  const uuid = Utils.generateUUID();
  console.log("✅ Utils.generateUUID funciona:", uuid);
} catch (error) {
  console.error("❌ Erro ao usar Utils:", error.message);
}

console.log("🎉 Teste de conversão concluído!");
