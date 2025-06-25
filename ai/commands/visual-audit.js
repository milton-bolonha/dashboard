#!/usr/bin/env node

/**
 * 👁️ Visual Audit - Análise visual inteligente de interfaces
 * Captura screenshots, detecta componentes, sugere testes visuais
 */

import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { ProjectDetector } from "../core/ProjectDetector.js";
import { VisualAnalyzer } from "../core/VisualAnalyzer.js";
import { ReportGenerator } from "../core/ReportGenerator.js";
import config from "../ai.config.js";

class VisualAuditCommand {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = path.join(this.projectRoot, config.outputs.baseDir);
  }

  async run() {
    console.log(chalk.blue.bold("👁️ AI Workspace - Visual Audit\n"));

    try {
      // 1. Detectar projeto
      const detection = await this.detectProject();

      // 2. Verificar se há servidor ativo
      if (detection.activePorts.length === 0) {
        console.log(chalk.yellow("⚠️ Nenhum servidor ativo detectado."));
        console.log(
          chalk.gray(
            "Inicie o servidor de desenvolvimento e tente novamente.\n"
          )
        );
        return;
      }

      // 3. Executar análise visual
      const visualData = await this.performVisualAnalysis(detection);

      // 4. Gerar relatório
      const report = await this.generateReport(detection, visualData);

      // 5. Mostrar resumo
      this.showSummary(visualData);
    } catch (error) {
      console.error(chalk.red("❌ Erro na auditoria visual:"), error.message);
      process.exit(1);
    }
  }

  /**
   * 🔍 Detecta projeto e configurações
   */
  async detectProject() {
    const spinner = ora("Detectando projeto...").start();

    try {
      const detector = new ProjectDetector(this.projectRoot);
      const detection = await detector.detect();

      spinner.succeed(
        `Projeto: ${chalk.cyan(detection.type)} (${
          detection.activePorts.length
        } porta${detection.activePorts.length !== 1 ? "s" : ""} ativa${
          detection.activePorts.length !== 1 ? "s" : ""
        })`
      );
      return detection;
    } catch (error) {
      spinner.fail("Erro na detecção");
      throw error;
    }
  }

  /**
   * 👁️ Executa análise visual completa
   */
  async performVisualAnalysis(detection) {
    const spinner = ora("Executando análise visual...").start();

    try {
      const analyzer = new VisualAnalyzer({
        detection,
        outputDir: this.outputDir,
      });

      const results = await analyzer.analyze();

      spinner.succeed(
        `Análise concluída: ${results.components.length} componentes, ${results.screenshots.length} screenshots`
      );
      return results;
    } catch (error) {
      spinner.fail("Erro na análise visual");
      throw error;
    }
  }

  /**
   * 📋 Gera relatório da análise
   */
  async generateReport(detection, visualData) {
    const spinner = ora("Gerando relatório...").start();

    try {
      const generator = new ReportGenerator({
        type: "visual-audit",
        detection,
        data: visualData,
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
  showSummary(visualData) {
    console.log(chalk.blue.bold("\n👁️ Resumo da Análise Visual:\n"));

    // Estatísticas gerais
    console.log(
      `${chalk.white("URL Analisada:")} ${chalk.cyan(visualData.url)}`
    );
    console.log(
      `${chalk.white("Componentes detectados:")} ${chalk.green(
        visualData.components.length
      )}`
    );
    console.log(
      `${chalk.white("Screenshots capturados:")} ${chalk.green(
        visualData.screenshots.length
      )}`
    );
    console.log(
      `${chalk.white("Tempo de carregamento:")} ${chalk.yellow(
        visualData.loadTime + "ms"
      )}`
    );

    // Breakdown por tipo de componente
    const componentTypes = visualData.components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(componentTypes).length > 0) {
      console.log(chalk.blue.bold("\n🧩 Componentes por Tipo:"));
      Object.entries(componentTypes).forEach(([type, count]) => {
        const icon = this.getComponentIcon(type);
        console.log(`${icon} ${chalk.white(type)}: ${chalk.green(count)}`);
      });
    }

    // Issues visuais encontrados
    if (visualData.issues && visualData.issues.length > 0) {
      console.log(chalk.yellow.bold("\n⚠️ Issues Visuais Detectados:"));
      visualData.issues.slice(0, 3).forEach((issue) => {
        console.log(chalk.yellow(`   • ${issue}`));
      });

      if (visualData.issues.length > 3) {
        console.log(
          chalk.gray(`   ... e mais ${visualData.issues.length - 3} issues`)
        );
      }
    }

    // Sugestões de testes
    if (visualData.testSuggestions && visualData.testSuggestions.length > 0) {
      console.log(chalk.blue.bold("\n🧪 Sugestões de Testes Gerados:"));
      visualData.testSuggestions.slice(0, 3).forEach((suggestion) => {
        console.log(
          chalk.white(`   • ${suggestion.type}: ${suggestion.description}`)
        );
      });
    }

    // Próximos passos
    console.log(chalk.blue.bold("\n🎯 Próximos Passos Recomendados:"));

    if (visualData.components.length > 10) {
      console.log(
        chalk.white(
          "   1. npm run ai:test-generate - Gerar testes para componentes"
        )
      );
    }

    if (visualData.loadTime > 2000) {
      console.log(
        chalk.white("   2. npm run ai:performance - Analisar performance")
      );
    }

    console.log(
      chalk.white("   3. npm run ai:accessibility - Verificar acessibilidade")
    );
    console.log(chalk.white("   4. Configurar testes visuais de regressão"));

    console.log(
      chalk.gray(
        `\n📖 Relatório completo em: ${config.outputs.baseDir}/reports/visual-audit.md`
      )
    );
    console.log(
      chalk.gray(`📸 Screenshots em: ${config.outputs.baseDir}/screenshots/`)
    );
  }

  /**
   * 🎨 Retorna ícone para tipo de componente
   */
  getComponentIcon(type) {
    const icons = {
      card: "📊",
      form: "📝",
      button: "🔘",
      input: "📝",
      navigation: "🧭",
      modal: "🪟",
      table: "📋",
      list: "📝",
      image: "🖼️",
      video: "🎥",
    };

    return icons[type] || "🧩";
  }
}

// Executar se chamado diretamente
async function main() {
  const command = new VisualAuditCommand();
  await command.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { VisualAuditCommand };
