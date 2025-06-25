#!/usr/bin/env node

/**
 * 🏥 Health Check - Análise completa da saúde do projeto
 * Verifica performance, dependencies, errors, e gera relatório inteligente
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import config from "../ai.config.js";
import { ProjectDetector } from "../core/ProjectDetector.js";
import { HealthAnalyzer } from "../core/HealthAnalyzer.js";
import { ReportGenerator } from "../core/ReportGenerator.js";

class HealthCheckCommand {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = path.join(this.projectRoot, config.outputs.baseDir);
  }

  async run() {
    console.log(chalk.blue.bold("🏥 AI Workspace - Health Check\n"));

    try {
      // 1. Detectar projeto
      const detection = await this.detectProject();

      // 2. Analisar saúde
      const healthData = await this.analyzeHealth(detection);

      // 3. Gerar relatório
      const report = await this.generateReport(detection, healthData);

      // 4. Mostrar resumo
      this.showSummary(healthData);

      // 5. Mostrar próximos passos
      this.showNextSteps(healthData);
    } catch (error) {
      console.error(chalk.red("❌ Erro no health check:"), error.message);
      process.exit(1);
    }
  }

  /**
   * 🔍 Detecta tipo de projeto
   */
  async detectProject() {
    const spinner = ora("Detectando projeto...").start();

    try {
      const detector = new ProjectDetector(this.projectRoot);
      const detection = await detector.detect();

      spinner.succeed(
        `Projeto: ${chalk.cyan(detection.type)}${
          detection.subtype ? chalk.gray(` (${detection.subtype})`) : ""
        }`
      );
      return detection;
    } catch (error) {
      spinner.fail("Erro na detecção");
      throw error;
    }
  }

  /**
   * 🔬 Analisa saúde do projeto
   */
  async analyzeHealth(detection) {
    const spinner = ora("Analisando saúde do projeto...").start();

    try {
      const analyzer = new HealthAnalyzer(detection);
      const healthData = await analyzer.analyze();

      const score = healthData.overallScore;
      const emoji = score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌";

      spinner.succeed(`Health Score: ${emoji} ${score}/100`);
      return healthData;
    } catch (error) {
      spinner.fail("Erro na análise");
      throw error;
    }
  }

  /**
   * 📋 Gera relatório detalhado
   */
  async generateReport(detection, healthData) {
    const spinner = ora("Gerando relatório...").start();

    try {
      const generator = new ReportGenerator({
        type: "health-check",
        detection,
        data: healthData,
        outputDir: this.outputDir,
      });

      const report = await generator.generate();

      spinner.succeed(`Relatório salvo: ${chalk.gray(report.filePath)}`);
      return report;
    } catch (error) {
      spinner.fail("Erro ao gerar relatório");
      throw error;
    }
  }

  /**
   * 📊 Mostra resumo dos resultados
   */
  showSummary(healthData) {
    console.log(chalk.blue.bold("\n📊 Resumo da Análise:\n"));

    // Score geral
    const score = healthData.overallScore;
    const scoreColor = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";
    console.log(
      `${chalk.white("Score Geral:")} ${chalk[scoreColor].bold(score + "/100")}`
    );

    // Categorias
    const categories = [
      {
        name: "Dependencies",
        score: healthData.dependencies.score,
        icon: "📦",
      },
      { name: "Security", score: healthData.security.score, icon: "🔒" },
      { name: "Performance", score: healthData.performance.score, icon: "⚡" },
      { name: "Code Quality", score: healthData.quality.score, icon: "✨" },
      { name: "Testing", score: healthData.testing.score, icon: "🧪" },
    ];

    console.log("");
    categories.forEach((cat) => {
      const catColor =
        cat.score >= 80 ? "green" : cat.score >= 60 ? "yellow" : "red";
      console.log(
        `${cat.icon} ${chalk.white(cat.name)}: ${chalk[catColor](
          cat.score + "/100"
        )}`
      );
    });

    // Issues críticos
    if (healthData.criticalIssues.length > 0) {
      console.log(chalk.red.bold("\n🚨 Issues Críticos:"));
      healthData.criticalIssues.forEach((issue) => {
        console.log(chalk.red(`   • ${issue}`));
      });
    }

    // Warnings
    if (healthData.warnings.length > 0) {
      console.log(chalk.yellow.bold("\n⚠️ Avisos:"));
      healthData.warnings.slice(0, 3).forEach((warning) => {
        console.log(chalk.yellow(`   • ${warning}`));
      });

      if (healthData.warnings.length > 3) {
        console.log(
          chalk.gray(`   ... e mais ${healthData.warnings.length - 3} avisos`)
        );
      }
    }
  }

  /**
   * 🎯 Mostra próximos passos recomendados
   */
  showNextSteps(healthData) {
    console.log(chalk.blue.bold("\n🎯 Próximos Passos Recomendados:\n"));

    // Ações prioritárias baseadas no score
    const score = healthData.overallScore;

    if (score < 60) {
      console.log(chalk.red.bold("🚨 Ação Urgente Necessária:"));
      console.log(chalk.white("   1. Corrigir issues críticos encontrados"));
      console.log(
        chalk.white("   2. npm run ai:security - Verificar vulnerabilidades")
      );
      console.log(
        chalk.white("   3. npm run ai:test-generate - Adicionar testes")
      );
    } else if (score < 80) {
      console.log(chalk.yellow.bold("⚠️ Melhorias Recomendadas:"));
      console.log(
        chalk.white("   1. npm run ai:test-generate - Melhorar cobertura")
      );
      console.log(
        chalk.white("   2. npm run ai:performance - Otimizar performance")
      );
      console.log(chalk.white("   3. npm run ai:quality - Melhorar qualidade"));
    } else {
      console.log(
        chalk.green.bold("✅ Projeto Saudável! Sugestões de Manutenção:")
      );
      console.log(chalk.white("   1. npm run ai:visual-audit - Verificar UI"));
      console.log(
        chalk.white("   2. npm run ai:performance - Monitorar performance")
      );
      console.log(chalk.white("   3. Configurar CI/CD se ainda não tiver"));
    }

    // Comandos específicos baseados em problemas encontrados
    console.log(chalk.blue("\n🔧 Comandos Específicos:"));

    if (healthData.dependencies.outdated.length > 0) {
      console.log(chalk.white("   • npm update - Atualizar dependências"));
    }

    if (healthData.security.vulnerabilities.length > 0) {
      console.log(
        chalk.white("   • npm audit fix - Corrigir vulnerabilidades")
      );
    }

    if (healthData.testing.coverage < 70) {
      console.log(
        chalk.white("   • npm run ai:test-generate - Gerar mais testes")
      );
    }

    if (healthData.performance.issues.length > 0) {
      console.log(
        chalk.white("   • npm run ai:performance - Análise detalhada")
      );
    }

    console.log(
      chalk.gray(
        `\n📖 Relatório completo em: ${config.outputs.baseDir}/reports/health-check.md`
      )
    );
  }
}

// Executar se chamado diretamente
async function main() {
  const command = new HealthCheckCommand();
  await command.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { HealthCheckCommand };
