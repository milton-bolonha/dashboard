#!/usr/bin/env node
/**
 * COMANDO PARA EXECUTAR A MIGRAÇÃO DE WORKSPACES
 *
 * Uso:
 * node scripts/run-migration.js
 * npm run migrate:workspaces
 */

import {
  migrateToWorkspaces,
  checkMigrationStatus,
} from "./migrate-to-workspaces.js";
import { migrateExposureMode } from "./migrate-exposure-mode.js";

async function main() {
  console.log("🚀 Dashboard Engine - Migração para Workspaces");
  console.log("━".repeat(60));

  try {
    // 1. Verificar status atual
    console.log("\n📊 STEP 1: Status Atual");
    await checkMigrationStatus();

    // 2. Confirmar migração
    console.log("\n🔄 STEP 2: Iniciando Migração");
    console.log("⚠️ Esta operação vai:");
    console.log("   - Criar workspaces para todos os usuários");
    console.log("   - Migrar content types, sections e items");
    console.log("   - Preservar todos os dados existentes");

    // 3. Executar migração principal
    await migrateToWorkspaces();

    // 3.1. Aplicar defaults de exposureMode/exposureSelection nas sections existentes
    console.log(
      "\n🔄 STEP 2.1: Aplicando defaults de exposureMode em Sections"
    );
    await migrateExposureMode();

    // 4. Verificar resultado
    console.log("\n🎯 STEP 3: Status Final");
    await checkMigrationStatus();

    console.log("\n✅ Migração finalizada com sucesso!");
    console.log("🎉 Sistema pronto para workspaces!");
  } catch (error) {
    console.error("\n💥 ERRO CRÍTICO:");
    console.error(error.message);
    console.error("\n🔧 Verifique:");
    console.error("   - Conexão com MongoDB");
    console.error("   - Variáveis de ambiente");
    console.error("   - Permissões do banco");

    process.exit(1);
  }
}

main(); // Executar a função principal diretamente

// Executar se chamado diretamente
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main();
// }
