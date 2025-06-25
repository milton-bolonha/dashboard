#!/usr/bin/env node

/**
 * 🤖 AI Development Workspace CLI
 * Ponto de entrada principal para todos os comandos
 */

import { program } from "commander";
import chalk from "chalk";
import { Setup } from "../core/Setup.js";
import { HealthCheckCommand } from "../commands/health-check.js";
import { VisualAuditCommand } from "../commands/visual-audit.js";
import config from "../ai.config.js";

// Configurar programa principal
program
  .name("ai-workspace")
  .description("🤖 AI-Powered Development Workspace")
  .version(config.version);

// Comando: setup
program
  .command("setup")
  .description("Configuração inicial do workspace")
  .option("--no-interactive", "Executar em modo não-interativo")
  .option("--force", "Forçar reconfiguração")
  .option("--skip-cursor", "Pular configuração do Cursor")
  .option("--skip-onboarding", "Pular experiência guiada (primeira vez)")
  .action(async (options) => {
    try {
      const setup = new Setup(options);
      await setup.run();
    } catch (error) {
      console.error(chalk.red("❌ Erro no setup:"), error.message);
      process.exit(1);
    }
  });

// Comando: interactive (interface visual)
program
  .command("interactive")
  .alias("ui")
  .description("Interface visual interativa com menus")
  .action(async () => {
    try {
      const { InteractiveCLI } = await import("../core/InteractiveCLI.js");
      const interactive = new InteractiveCLI();
      await interactive.start();
    } catch (error) {
      console.error(
        chalk.red("❌ Erro na interface interativa:"),
        error.message
      );
      process.exit(1);
    }
  });

// Comando: onboarding (experiência guiada)
program
  .command("onboarding")
  .alias("welcome")
  .description("Experiência guiada para primeira vez")
  .action(async () => {
    try {
      const { Onboarding } = await import("../core/Onboarding.js");
      const onboarding = new Onboarding();
      await onboarding.run();
    } catch (error) {
      console.error(chalk.red("❌ Erro no onboarding:"), error.message);
      process.exit(1);
    }
  });

// Comando: health-check
program
  .command("health-check")
  .alias("health")
  .description("Análise completa da saúde do projeto")
  .option("--format <format>", "Formato do output (json|markdown)", "markdown")
  .option("--output <path>", "Caminho do arquivo de output")
  .action(async (options) => {
    try {
      const command = new HealthCheckCommand(options);
      await command.run();
    } catch (error) {
      console.error(chalk.red("❌ Erro no health check:"), error.message);
      process.exit(1);
    }
  });

// Comando: visual-audit
program
  .command("visual-audit")
  .alias("visual")
  .description("Análise visual da interface")
  .option("--url <url>", "URL específica para analisar")
  .option(
    "--viewports <viewports>",
    "Viewports para testar (mobile,tablet,desktop)",
    "desktop"
  )
  .option("--full-page", "Capturar página completa", true)
  .action(async (options) => {
    try {
      const command = new VisualAuditCommand(options);
      await command.run();
    } catch (error) {
      console.error(chalk.red("❌ Erro na auditoria visual:"), error.message);
      process.exit(1);
    }
  });

// Comando: persona (gerenciamento de personalidades)
program
  .command("persona")
  .alias("p")
  .description("Gerenciamento de personalidades IA")
  .argument("[action]", "Ação: list, switch, create, status, interactive")
  .action(async (action) => {
    try {
      const { PersonaCommand } = await import("../commands/persona.js");
      const command = new PersonaCommand({ action });
      await command.run();
    } catch (error) {
      console.error(
        chalk.red("❌ Erro no gerenciamento de personas:"),
        error.message
      );
      process.exit(1);
    }
  });

// Comando: test-generate
program
  .command("test-generate")
  .alias("test-gen")
  .description("Gera testes automaticamente")
  .option("--framework <framework>", "Framework de teste (jest|vitest|cypress)")
  .option("--type <type>", "Tipo de teste (unit|integration|e2e)", "unit")
  .option("--coverage", "Configurar coverage", false)
  .action(async (options) => {
    try {
      console.log(chalk.blue("🧪 Test Generation - Em desenvolvimento"));
      console.log(
        chalk.gray("Este comando estará disponível na próxima versão.")
      );
    } catch (error) {
      console.error(chalk.red("❌ Erro na geração de testes:"), error.message);
      process.exit(1);
    }
  });

// Comando: cursor-optimize
program
  .command("cursor-optimize")
  .alias("cursor")
  .description("Otimiza configuração do Cursor IDE")
  .option("--force", "Forçar reconfiguração")
  .action(async (options) => {
    try {
      console.log(chalk.blue("🎯 Cursor Optimization - Em desenvolvimento"));
      console.log(
        chalk.gray("Este comando estará disponível na próxima versão.")
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Erro na otimização do Cursor:"),
        error.message
      );
      process.exit(1);
    }
  });

// Comando: performance
program
  .command("performance")
  .alias("perf")
  .description("Análise de performance")
  .option("--url <url>", "URL para analisar")
  .option(
    "--metrics <metrics>",
    "Métricas específicas (lcp,fid,cls)",
    "lcp,fid,cls"
  )
  .action(async (options) => {
    try {
      console.log(chalk.blue("⚡ Performance Analysis - Em desenvolvimento"));
      console.log(
        chalk.gray("Este comando estará disponível na próxima versão.")
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Erro na análise de performance:"),
        error.message
      );
      process.exit(1);
    }
  });

// Comando: security
program
  .command("security")
  .alias("sec")
  .description("Análise de segurança")
  .option("--audit", "Executar npm audit", true)
  .option("--headers", "Verificar headers de segurança", true)
  .action(async (options) => {
    try {
      console.log(chalk.blue("🔒 Security Analysis - Em desenvolvimento"));
      console.log(
        chalk.gray("Este comando estará disponível na próxima versão.")
      );
    } catch (error) {
      console.error(
        chalk.red("❌ Erro na análise de segurança:"),
        error.message
      );
      process.exit(1);
    }
  });

// Comando: clean
program
  .command("clean")
  .description("Limpa outputs antigos")
  .option(
    "--older-than <days>",
    "Limpar arquivos mais antigos que X dias",
    "30"
  )
  .option("--force", "Forçar limpeza sem confirmação")
  .action(async (options) => {
    try {
      console.log(chalk.blue("🧹 Cleanup - Em desenvolvimento"));
      console.log(
        chalk.gray("Este comando estará disponível na próxima versão.")
      );
    } catch (error) {
      console.error(chalk.red("❌ Erro na limpeza:"), error.message);
      process.exit(1);
    }
  });

// Comando: status
program
  .command("status")
  .description("Status atual do workspace")
  .action(async () => {
    try {
      await showStatus();
    } catch (error) {
      console.error(chalk.red("❌ Erro ao verificar status:"), error.message);
      process.exit(1);
    }
  });

// Comando: goshdev (comando especial da goshDev! 👩‍💻)
program
  .command("goshdev")
  .alias("gosh")
  .description(
    "👩‍💻 Modo goshDev! Interface interativa com a persona mais animada!"
  )
  .action(async () => {
    try {
      // Ativar persona goshDev primeiro
      const { PersonaManager } = await import("../core/PersonaManager.js");
      const personaManager = new PersonaManager();
      await personaManager.loadPersonaConfig();
      await personaManager.setActivePersona("goshdev");

      console.log(chalk.magenta.bold("🚀 Modo goshDev ativado!"));
      console.log(chalk.cyan("👩‍💻 Oi! Sou a goshDev e vamos arrasar juntos!"));

      // Abrir interface interativa
      const { InteractiveCLI } = await import("../core/InteractiveCLI.js");
      const interactive = new InteractiveCLI();
      await interactive.start();
    } catch (error) {
      console.error(
        chalk.red("❌ Erro ao ativar modo goshDev:"),
        error.message
      );
      process.exit(1);
    }
  });

// Função para mostrar status
async function showStatus() {
  console.log(chalk.blue.bold("🤖 AI Workspace Status\n"));

  try {
    // Importar ProjectDetector dinamicamente para evitar erro se não estiver configurado
    const { ProjectDetector } = await import("../core/ProjectDetector.js");
    const detector = new ProjectDetector();
    const detection = await detector.detect();

    console.log(chalk.white("📋 Projeto:"));
    console.log(
      `   Tipo: ${chalk.cyan(detection.type)}${
        detection.subtype ? chalk.gray(` (${detection.subtype})`) : ""
      }`
    );
    console.log(`   Confiança: ${chalk.yellow(detection.confidence + "%")}`);
    console.log(
      `   Portas ativas: ${
        detection.activePorts.length > 0
          ? chalk.green(detection.activePorts.join(", "))
          : chalk.gray("Nenhuma")
      }`
    );

    console.log(chalk.white("\n🛠️ Features:"));
    console.log(
      `   TypeScript: ${detection.features.typescript ? "✅" : "❌"}`
    );
    console.log(
      `   Testes: ${
        detection.features.testing.length > 0
          ? "✅ " + detection.features.testing.join(", ")
          : "❌"
      }`
    );
    console.log(`   Linting: ${detection.features.linting ? "✅" : "❌"}`);

    console.log(chalk.white("\n📁 Outputs:"));
    const fs = await import("fs-extra");
    const path = await import("path");

    const outputDir = path.join(process.cwd(), config.outputs.baseDir);
    if (await fs.pathExists(outputDir)) {
      const screenshots = await fs
        .readdir(path.join(outputDir, "screenshots"))
        .catch(() => []);
      const reports = await fs
        .readdir(path.join(outputDir, "reports"))
        .catch(() => []);

      console.log(`   Screenshots: ${chalk.green(screenshots.length)}`);
      console.log(`   Relatórios: ${chalk.green(reports.length)}`);
    } else {
      console.log(chalk.gray("   Nenhum output ainda"));
    }

    console.log(chalk.white("\n🎯 Comandos Disponíveis:"));
    console.log(
      chalk.cyan("   ai-workspace interactive") +
        chalk.gray("   # Interface visual com menus")
    );
    console.log(
      chalk.cyan("   ai-workspace health-check") +
        chalk.gray("  # Verificar saúde do projeto")
    );
    console.log(
      chalk.cyan("   ai-workspace visual-audit") +
        chalk.gray("  # Análise visual da interface")
    );
    console.log(
      chalk.cyan("   ai-workspace setup --force") +
        chalk.gray("  # Reconfigurar workspace")
    );
  } catch (error) {
    console.log(chalk.yellow("⚠️ Workspace não configurado ainda"));
    console.log(chalk.gray("Execute: ai-workspace setup"));
  }
}

// Handler para comandos não reconhecidos
program.on("command:*", () => {
  console.error(
    chalk.red(`❌ Comando desconhecido: ${program.args.join(" ")}`)
  );
  console.log(
    chalk.gray('Execute "ai-workspace --help" para ver comandos disponíveis')
  );
  process.exit(1);
});

// Handler para erros não capturados
process.on("uncaughtException", (error) => {
  console.error(chalk.red("❌ Erro não capturado:"), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("❌ Promise rejeitada:"), reason);
  if (process.env.DEBUG) {
    console.error("Promise:", promise);
  }
  process.exit(1);
});

// Banner de ajuda personalizado
program.helpInformation = function () {
  return `
${chalk.magenta.bold("👩‍💻 goshDev AI Workspace")}

${chalk.white("DESCRIÇÃO:")}
  Sistema de personas animadas para desenvolvimento com IA
  Detecta automaticamente seu stack e configura ferramentas inteligentes

${chalk.white("USO:")}
  ai-workspace <comando> [opções]
  goshdev                    # Modo direto da goshDev! 🚀

${chalk.white("COMANDOS PRINCIPAIS:")}
${chalk.magenta(
  "  goshdev            🚀 Modo goshDev - Persona animada e técnica!"
)}
  interactive        Interface visual interativa com menus
  setup              Configuração inicial do workspace
  onboarding         Experiência guiada para primeira vez
  health-check       Análise completa da saúde do projeto
  visual-audit       Análise visual da interface
  persona            Gerenciamento de personalidades IA
  status             Status atual do workspace

${chalk.white("COMANDOS EM DESENVOLVIMENTO:")}
  test-generate      Gera testes automaticamente
  cursor-optimize    Otimiza configuração do Cursor IDE
  performance        Análise de performance
  security           Análise de segurança

${chalk.white("OPÇÕES GLOBAIS:")}
  -V, --version      Mostra versão
  -h, --help         Mostra esta ajuda

${chalk.white("EXEMPLOS:")}
${chalk.magenta(
  "  goshdev                               # 🚀 Modo goshDev direto!"
)}
${chalk.magenta("  ai-workspace goshdev                  # Mesmo que acima")}
  ai-workspace interactive              # Interface visual interativa
  ai-workspace setup                    # Setup inicial
  ai-workspace persona switch           # Trocar persona
${chalk.gray(
  "  ai-workspace persona list             # Ver personas disponíveis"
)}

${chalk.yellow("💡 DICA:")} Use ${chalk.magenta(
    "goshdev"
  )} para ativar diretamente a persona mais animada!

${chalk.gray("Documentação: https://github.com/ai-dev-workspace/core")}
${chalk.gray("Issues: https://github.com/ai-dev-workspace/core/issues")}
`;
};

// Parse dos argumentos
program.parse();

// Se nenhum comando foi fornecido, mostrar help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
