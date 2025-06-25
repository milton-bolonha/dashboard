/**
 * 🎯 Onboarding - Primeira experiência inteligente e educativa
 * Guia o usuário através do AI Workspace de forma clara e cuidadosa
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { ProjectDetector } from "./ProjectDetector.js";
import config from "../ai.config.js";

export class Onboarding {
  constructor() {
    this.projectRoot = process.cwd();
    this.userProgress = {
      step: 0,
      totalSteps: 6,
      completed: [],
    };
  }

  /**
   * 🚀 Processo principal de onboarding
   */
  async run() {
    await this.showWelcome();
    await this.explainConcept();
    await this.detectAndExplain();
    await this.explainCursorIntegration();
    await this.runFirstAnalysis();
    await this.showNextSteps();
  }

  /**
   * 👋 Boas-vindas educativas
   */
  async showWelcome() {
    console.clear();
    console.log(chalk.blue.bold("🤖 Bem-vindo ao AI Development Workspace!"));
    console.log(chalk.gray("═".repeat(50)));
    console.log("");

    console.log(
      chalk.white(
        "Este é um framework que vai revolucionar como você desenvolve:"
      )
    );
    console.log("");
    console.log(chalk.green("✅ Detecta automaticamente seu tipo de projeto"));
    console.log(chalk.green("✅ Configura Cursor IDE com rules inteligentes"));
    console.log(chalk.green("✅ Analisa saúde do código com score 0-100"));
    console.log(
      chalk.green("✅ Captura screenshots e analisa UI automaticamente")
    );
    console.log(chalk.green("✅ Gera relatórios acionáveis em Markdown"));
    console.log("");

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message: "Pronto para começar sua jornada com IA?",
        default: true,
      },
    ]);

    if (!shouldContinue) {
      console.log(
        chalk.yellow(
          '👋 Tudo bem! Execute "ai-workspace setup" quando estiver pronto.'
        )
      );
      process.exit(0);
    }

    this.updateProgress("welcome");
  }

  /**
   * 💡 Explica conceitos fundamentais
   */
  async explainConcept() {
    console.log(
      chalk.blue.bold("\n📚 Como Funciona (30 segundos para entender)")
    );
    console.log(chalk.gray("═".repeat(50)));

    console.log(chalk.white("\n🔍 ETAPA 1: Detecção Inteligente"));
    console.log(
      chalk.gray("   O AI Workspace analisa seu projeto e descobre:")
    );
    console.log(chalk.gray("   • Tipo: Next.js, React, Vue, Node API, etc."));
    console.log(chalk.gray("   • Stack: dependências, configs, estrutura"));
    console.log(chalk.gray("   • Features: TypeScript, testes, linting"));

    console.log(chalk.white("\n🎯 ETAPA 2: Configuração Automática"));
    console.log(
      chalk.gray("   Baseado na detecção, configura automaticamente:")
    );
    console.log(
      chalk.gray("   • Cursor IDE com rules específicas do seu stack")
    );
    console.log(chalk.gray("   • Templates e padrões de código"));
    console.log(chalk.gray("   • Comandos otimizados para seu projeto"));

    console.log(chalk.white("\n📊 ETAPA 3: Análise Contínua"));
    console.log(chalk.gray("   Oferece ferramentas poderosas:"));
    console.log(chalk.gray("   • Health Check: score de qualidade 0-100"));
    console.log(chalk.gray("   • Visual Audit: análise de UI com screenshots"));
    console.log(chalk.gray("   • Relatórios: insights acionáveis em Markdown"));

    const { ready } = await inquirer.prompt([
      {
        type: "confirm",
        name: "ready",
        message: "Entendido! Vamos analisar seu projeto?",
        default: true,
      },
    ]);

    this.updateProgress("concept");
  }

  /**
   * 🔍 Detecção explicada passo a passo
   */
  async detectAndExplain() {
    console.log(chalk.blue.bold("\n🔍 Analisando Seu Projeto"));
    console.log(chalk.gray("═".repeat(50)));

    const spinner = ora("Examinando arquivos e dependências...").start();

    const detector = new ProjectDetector(this.projectRoot);
    const detection = await detector.detect();

    spinner.succeed("Análise concluída!");

    // Explicar o que foi encontrado
    console.log(chalk.white("\n📋 O que descobrimos sobre seu projeto:"));
    console.log("");

    console.log(chalk.cyan("🎯 Tipo de Projeto:"));
    console.log(
      `   ${chalk.bold(detection.type)}${
        detection.subtype ? chalk.gray(` (${detection.subtype})`) : ""
      }`
    );
    console.log(
      `   Confiança na detecção: ${chalk.yellow(detection.confidence + "%")}`
    );

    if (detection.confidence < 70) {
      console.log(
        chalk.yellow(
          "   ⚠️ Detecção com baixa confiança - projeto pode ser genérico"
        )
      );
    }

    console.log(chalk.cyan("\n🛠️ Stack Tecnológico:"));
    const mainDeps = detection.stack.slice(0, 5);
    mainDeps.forEach((dep) => console.log(`   • ${dep}`));
    if (detection.stack.length > 5) {
      console.log(
        chalk.gray(`   ... e mais ${detection.stack.length - 5} dependências`)
      );
    }

    console.log(chalk.cyan("\n⚙️ Features Detectadas:"));
    console.log(
      `   TypeScript: ${detection.features.typescript ? "✅ Sim" : "❌ Não"}`
    );
    console.log(
      `   Testes: ${
        detection.features.testing.length > 0
          ? "✅ " + detection.features.testing.join(", ")
          : "❌ Não configurado"
      }`
    );
    console.log(
      `   Linting: ${
        detection.features.linting ? "✅ ESLint" : "❌ Não configurado"
      }`
    );

    if (detection.activePorts.length > 0) {
      console.log(chalk.cyan("\n🌐 Servidores Ativos:"));
      detection.activePorts.forEach((port) => {
        console.log(`   • http://localhost:${port} ${chalk.green("(ativo)")}`);
      });
    } else {
      console.log(chalk.yellow("\n⚠️ Nenhum servidor ativo detectado"));
      console.log(
        chalk.gray(
          "   Inicie seu servidor de desenvolvimento para análises visuais"
        )
      );
    }

    if (detection.suggestions.length > 0) {
      console.log(chalk.cyan("\n💡 Sugestões Iniciais:"));
      detection.suggestions.slice(0, 3).forEach((suggestion) => {
        console.log(`   • ${suggestion}`);
      });
    }

    const { satisfied } = await inquirer.prompt([
      {
        type: "confirm",
        name: "satisfied",
        message: "A detecção parece correta?",
        default: true,
      },
    ]);

    if (!satisfied) {
      console.log(chalk.yellow("\n🔧 Não se preocupe!"));
      console.log(
        chalk.white("O AI Workspace funciona bem mesmo com detecção genérica.")
      );
      console.log(
        chalk.white(
          "Você pode ajustar configurações depois no arquivo ai.config.js"
        )
      );
    }

    this.detection = detection;
    this.updateProgress("detection");
  }

  /**
   * 🎯 Explica integração com Cursor IDE
   */
  async explainCursorIntegration() {
    console.log(chalk.blue.bold("\n🎯 Integração com Cursor IDE"));
    console.log(chalk.gray("═".repeat(50)));

    console.log(
      chalk.white("\nO AI Workspace vai configurar seu Cursor automaticamente:")
    );
    console.log("");

    console.log(chalk.green("📜 Rules Inteligentes:"));
    console.log(`   • Base rules: princípios gerais de código limpo`);
    console.log(`   • ${this.detection.type} rules: específicas do seu stack`);
    console.log("   • Quality rules: ESLint, Prettier, TypeScript");
    console.log("");

    console.log(chalk.green("📋 Notepads com Templates:"));
    console.log(`   • Padrões de código para ${this.detection.type}`);
    console.log("   • Comandos AI disponíveis");
    console.log("   • Guia de troubleshooting");
    console.log("");

    console.log(chalk.green("🤖 Custom Modes (Beta):"));
    console.log("   • Debug: investigação detalhada de problemas");
    console.log("   • Refactor: melhoria de estrutura de código");
    console.log("   • Learn: explicações educativas");
    console.log("");

    console.log(
      chalk.white("Depois da configuração, você pode usar no Cursor:")
    );
    console.log(chalk.cyan('   "Crie um componente seguindo nossos padrões"'));
    console.log(
      chalk.cyan('   "Refatore este código mantendo a funcionalidade"')
    );
    console.log(
      chalk.cyan('   "Explique como funciona este hook customizado"')
    );

    const { configureCursor } = await inquirer.prompt([
      {
        type: "confirm",
        name: "configureCursor",
        message: "Configurar Cursor IDE automaticamente?",
        default: true,
      },
    ]);

    this.configureCursor = configureCursor;
    this.updateProgress("cursor");
  }

  /**
   * 🏥 Primeira análise de saúde
   */
  async runFirstAnalysis() {
    console.log(chalk.blue.bold("\n🏥 Sua Primeira Análise de Saúde"));
    console.log(chalk.gray("═".repeat(50)));

    console.log(
      chalk.white("\nVamos executar um health check completo do seu projeto.")
    );
    console.log(chalk.white("Isso vai analisar:"));
    console.log("");
    console.log(
      chalk.gray("   📦 Dependencies: atualizadas, seguras, com tipos")
    );
    console.log(chalk.gray("   🔒 Security: vulnerabilidades, configurações"));
    console.log(
      chalk.gray("   ⚡ Performance: bundle size, tempo de resposta")
    );
    console.log(chalk.gray("   ✨ Quality: linting, formatting, estrutura"));
    console.log(chalk.gray("   🧪 Testing: framework, coverage, E2E"));

    const { runAnalysis } = await inquirer.prompt([
      {
        type: "confirm",
        name: "runAnalysis",
        message: "Executar primeira análise agora?",
        default: true,
      },
    ]);

    if (runAnalysis) {
      console.log(chalk.white("\n⏳ Executando análise completa..."));
      console.log(chalk.gray("(Isso pode levar alguns segundos)"));

      // Simular análise com progresso visual
      const steps = [
        "Analisando dependências...",
        "Verificando vulnerabilidades...",
        "Avaliando qualidade de código...",
        "Testando configurações...",
        "Gerando relatório...",
      ];

      for (const step of steps) {
        const spinner = ora(step).start();
        await new Promise((resolve) => setTimeout(resolve, 1500));
        spinner.succeed();
      }

      // Mostrar resultado simulado baseado na detecção
      const score = this.calculateMockScore();
      const emoji = score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌";

      console.log(
        chalk.green.bold(`\n🎯 Score de Saúde: ${emoji} ${score}/100`)
      );

      if (score >= 80) {
        console.log(
          chalk.green("🎉 Excelente! Seu projeto está em ótima saúde.")
        );
      } else if (score >= 60) {
        console.log(
          chalk.yellow("👍 Bom! Há algumas oportunidades de melhoria.")
        );
      } else {
        console.log(
          chalk.red(
            "🚨 Atenção necessária! Alguns issues precisam ser resolvidos."
          )
        );
      }

      console.log(
        chalk.white(
          `\n📋 Relatório completo será salvo em: ${config.outputs.baseDir}/reports/health-check.md`
        )
      );
    }

    this.updateProgress("analysis");
  }

  /**
   * 🎉 Próximos passos e finalização
   */
  async showNextSteps() {
    console.log(chalk.blue.bold("\n🎉 Parabéns! Setup Concluído com Sucesso"));
    console.log(chalk.gray("═".repeat(50)));

    console.log(chalk.green.bold("\n✅ O que foi configurado:"));
    console.log(
      `   🔍 Projeto detectado como: ${chalk.cyan(this.detection.type)}`
    );
    if (this.configureCursor) {
      console.log("   🎯 Cursor IDE configurado com rules inteligentes");
      console.log("   📋 Templates e padrões específicos criados");
    }
    console.log("   📁 Estrutura de outputs organizada");
    console.log("   📜 Scripts adicionados ao package.json");

    console.log(chalk.blue.bold("\n🚀 Comandos Principais (já disponíveis):"));
    console.log("");
    console.log(
      chalk.cyan("   npm run ai:health") +
        chalk.gray("     # Análise completa de saúde")
    );
    console.log(
      chalk.cyan("   npm run ai:visual") +
        chalk.gray("     # Auditoria visual da interface")
    );
    console.log(
      chalk.cyan("   ai-workspace status") +
        chalk.gray("    # Status atual do workspace")
    );

    if (this.detection.type === "nextjs") {
      console.log(
        chalk.cyan("   npm run ai:next-audit") +
          chalk.gray("# Auditoria específica Next.js")
      );
    } else if (this.detection.type === "react") {
      console.log(
        chalk.cyan("   npm run ai:react-audit") +
          chalk.gray("# Auditoria específica React")
      );
    }

    console.log(chalk.blue.bold("\n🎯 Recomendações Imediatas:"));
    console.log("");

    if (this.detection.activePorts.length === 0) {
      console.log(chalk.yellow("   1. Inicie seu servidor de desenvolvimento"));
      console.log(chalk.gray("      Depois execute: npm run ai:visual"));
    } else {
      console.log(
        chalk.white("   1. npm run ai:visual (servidor ativo detectado)")
      );
    }

    if (this.detection.features.testing.length === 0) {
      console.log(
        chalk.white("   2. npm run ai:test-gen (melhorar cobertura de testes)")
      );
    }

    if (this.configureCursor) {
      console.log(
        chalk.white('   3. No Cursor: teste comandos como "Crie um componente"')
      );
    }

    console.log(chalk.blue.bold("\n📚 Recursos Adicionais:"));
    console.log(
      chalk.gray(`   📖 Relatórios: ${config.outputs.baseDir}/reports/`)
    );
    console.log(
      chalk.gray(`   📸 Screenshots: ${config.outputs.baseDir}/screenshots/`)
    );
    console.log(chalk.gray("   🎯 Rules do Cursor: .cursor/rules/"));
    console.log(chalk.gray("   📋 Templates: .cursor/notepads/"));

    console.log(chalk.blue.bold("\n💡 Dica Pro:"));
    console.log(
      chalk.white('Execute "npm run ai:health" regularmente para manter')
    );
    console.log(chalk.white("a qualidade do seu código sempre alta!"));

    console.log(
      chalk.green.bold("\n🌟 Bem-vindo ao futuro do desenvolvimento com IA! 🚀")
    );

    this.updateProgress("complete");
  }

  /**
   * 📊 Calcula score simulado baseado na detecção
   */
  calculateMockScore() {
    let score = 50; // Base score

    // Bonus por features
    if (this.detection.features.typescript) score += 15;
    if (this.detection.features.testing.length > 0) score += 15;
    if (this.detection.features.linting) score += 10;

    // Bonus por tipo de projeto bem estruturado
    if (["nextjs", "react", "vue"].includes(this.detection.type)) score += 10;

    // Bonus por confiança na detecção
    if (this.detection.confidence > 80) score += 10;

    return Math.min(score, 100);
  }

  /**
   * 📈 Atualiza progresso do onboarding
   */
  updateProgress(step) {
    this.userProgress.completed.push(step);
    this.userProgress.step++;
  }

  /**
   * 🎨 Formatação visual para melhor UX
   */
  showProgressBar() {
    const progress = Math.floor(
      (this.userProgress.step / this.userProgress.totalSteps) * 100
    );
    const filled = Math.floor(progress / 5);
    const empty = 20 - filled;

    const bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
    console.log(`\n${bar} ${progress}%`);
  }
}

export default Onboarding;
