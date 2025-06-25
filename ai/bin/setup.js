#!/usr/bin/env node

/**
 * 🚀 AI Workspace Setup - Entry Point
 * Executa configuração inicial completa do workspace
 */

import { Setup } from "../core/Setup.js";
import chalk from "chalk";

async function main() {
  try {
    // Banner
    console.log(chalk.blue.bold("\n🤖 AI Development Workspace"));
    console.log(chalk.gray("Configuração inicial inteligente\n"));

    // Parse argumentos da linha de comando
    const args = process.argv.slice(2);
    const options = {
      interactive: !args.includes("--no-interactive"),
      force: args.includes("--force"),
      skipCursor: args.includes("--skip-cursor"),
      skipOnboarding: args.includes("--skip-onboarding"),
    };

    if (args.includes("--help") || args.includes("-h")) {
      showHelp();
      return;
    }

    // Executar setup
    const setup = new Setup(options);
    await setup.run();
  } catch (error) {
    console.error(chalk.red("\n❌ Erro durante setup:"), error.message);

    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.blue.bold("🤖 AI Workspace Setup\n"));

  console.log(chalk.white("USAGE:"));
  console.log("  npm run setup [options]\n");

  console.log(chalk.white("OPTIONS:"));
  console.log("  --no-interactive     Executar em modo não-interativo");
  console.log("  --force             Forçar reconfiguração");
  console.log("  --skip-cursor       Pular configuração do Cursor");
  console.log("  --skip-onboarding   Pular experiência guiada");
  console.log("  --help, -h          Mostrar esta ajuda\n");

  console.log(chalk.white("EXAMPLES:"));
  console.log(
    "  npm run setup                     # Setup interativo completo"
  );
  console.log("  npm run setup --no-interactive    # Setup automático");
  console.log("  npm run setup --skip-cursor       # Setup sem Cursor");
  console.log("  npm run setup --skip-onboarding   # Setup direto");
  console.log("  npm run setup --force             # Forçar reconfiguração\n");
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
