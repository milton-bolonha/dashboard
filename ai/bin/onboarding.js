#!/usr/bin/env node

/**
 * 🎯 AI Workspace Onboarding - Experiência guiada
 * Comando para executar apenas o onboarding educativo
 */

import { Onboarding } from "../core/Onboarding.js";
import chalk from "chalk";

async function main() {
  try {
    console.log(chalk.blue.bold("🎯 AI Workspace - Experiência Guiada\n"));

    const onboarding = new Onboarding();
    await onboarding.run();
  } catch (error) {
    console.error(chalk.red("\n❌ Erro durante onboarding:"), error.message);

    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }

    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
