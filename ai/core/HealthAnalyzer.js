/**
 * 🔬 Health Analyzer - Análise detalhada da saúde do projeto
 * Avalia dependencies, security, performance, quality, testing
 */

import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";

const execAsync = promisify(exec);

export class HealthAnalyzer {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.packageJsonPath = path.join(this.projectRoot, "package.json");
  }

  /**
   * 🎯 Análise principal - coordena todas as verificações
   */
  async analyze() {
    const results = {
      timestamp: new Date().toISOString(),
      project: this.detection,
      dependencies: await this.analyzeDependencies(),
      security: await this.analyzeSecurity(),
      performance: await this.analyzePerformance(),
      quality: await this.analyzeQuality(),
      testing: await this.analyzeTesting(),
      criticalIssues: [],
      warnings: [],
      suggestions: [],
    };

    // Calcular score geral
    results.overallScore = this.calculateOverallScore(results);

    // Consolidar issues
    this.consolidateIssues(results);

    return results;
  }

  /**
   * 📦 Analisa dependências do projeto
   */
  async analyzeDependencies() {
    const analysis = {
      score: 100,
      total: 0,
      outdated: [],
      vulnerable: [],
      unused: [],
      missingTypes: [],
      issues: [],
    };

    try {
      if (!(await fs.pathExists(this.packageJsonPath))) {
        analysis.score = 0;
        analysis.issues.push("package.json não encontrado");
        return analysis;
      }

      const packageJson = await fs.readJson(this.packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      analysis.total = Object.keys(allDeps).length;

      // Verificar dependências desatualizadas
      try {
        const { stdout } = await execAsync("npm outdated --json", {
          cwd: this.projectRoot,
        });
        const outdated = JSON.parse(stdout || "{}");
        analysis.outdated = Object.keys(outdated);

        if (analysis.outdated.length > 0) {
          analysis.score -= Math.min(analysis.outdated.length * 2, 20);
          analysis.issues.push(
            `${analysis.outdated.length} dependências desatualizadas`
          );
        }
      } catch (error) {
        // npm outdated retorna exit code 1 quando há packages outdated
        if (error.stdout) {
          try {
            const outdated = JSON.parse(error.stdout);
            analysis.outdated = Object.keys(outdated);
            if (analysis.outdated.length > 0) {
              analysis.score -= Math.min(analysis.outdated.length * 2, 20);
              analysis.issues.push(
                `${analysis.outdated.length} dependências desatualizadas`
              );
            }
          } catch (parseError) {
            // Ignore parse errors
          }
        }
      }

      // Verificar dependências vulneráveis
      try {
        const { stdout } = await execAsync("npm audit --json", {
          cwd: this.projectRoot,
        });
        const auditData = JSON.parse(stdout);

        if (auditData.vulnerabilities) {
          const vulnerabilities = Object.values(auditData.vulnerabilities);
          analysis.vulnerable = vulnerabilities.map((v) => v.name);

          const highSeverity = vulnerabilities.filter(
            (v) => v.severity === "high" || v.severity === "critical"
          ).length;

          analysis.score -= Math.min(
            highSeverity * 10 + (vulnerabilities.length - highSeverity) * 2,
            40
          );

          if (vulnerabilities.length > 0) {
            analysis.issues.push(
              `${vulnerabilities.length} vulnerabilidades encontradas`
            );
          }
        }
      } catch (error) {
        // npm audit pode falhar, mas não é crítico
      }

      // Verificar tipos TypeScript ausentes
      if (this.detection.features.typescript) {
        const missingTypes = [];

        for (const dep of Object.keys(packageJson.dependencies || {})) {
          const typesPackage = `@types/${dep}`;
          if (!allDeps[typesPackage] && !allDeps[dep + "-types"]) {
            missingTypes.push(dep);
          }
        }

        analysis.missingTypes = missingTypes.slice(0, 5); // Limitar para principais

        if (missingTypes.length > 0) {
          analysis.score -= Math.min(missingTypes.length, 10);
          analysis.issues.push(
            `${missingTypes.length} pacotes sem tipos TypeScript`
          );
        }
      }
    } catch (error) {
      analysis.score = 50;
      analysis.issues.push(`Erro na análise de dependências: ${error.message}`);
    }

    return analysis;
  }

  /**
   * 🔒 Analisa segurança do projeto
   */
  async analyzeSecurity() {
    const analysis = {
      score: 100,
      vulnerabilities: [],
      configIssues: [],
      missingHeaders: [],
      issues: [],
    };

    try {
      // Verificar vulnerabilidades conhecidas
      try {
        const { stdout } = await execAsync("npm audit --json", {
          cwd: this.projectRoot,
        });
        const auditData = JSON.parse(stdout);

        if (auditData.vulnerabilities) {
          analysis.vulnerabilities = Object.values(auditData.vulnerabilities);

          const critical = analysis.vulnerabilities.filter(
            (v) => v.severity === "critical"
          ).length;
          const high = analysis.vulnerabilities.filter(
            (v) => v.severity === "high"
          ).length;
          const moderate = analysis.vulnerabilities.filter(
            (v) => v.severity === "moderate"
          ).length;

          analysis.score -= critical * 15 + high * 10 + moderate * 5;

          if (analysis.vulnerabilities.length > 0) {
            analysis.issues.push(
              `${analysis.vulnerabilities.length} vulnerabilidades de segurança`
            );
          }
        }
      } catch (error) {
        // Audit pode falhar, continuar análise
      }

      // Verificar configurações de segurança
      await this.checkSecurityConfigs(analysis);

      // Verificar cabeçalhos de segurança (se for web app)
      if (this.detection.activePorts.length > 0) {
        await this.checkSecurityHeaders(analysis);
      }
    } catch (error) {
      analysis.score = 70;
      analysis.issues.push(`Erro na análise de segurança: ${error.message}`);
    }

    return analysis;
  }

  /**
   * ⚡ Analisa performance do projeto
   */
  async analyzePerformance() {
    const analysis = {
      score: 100,
      bundleSize: null,
      buildTime: null,
      serverResponse: null,
      issues: [],
      suggestions: [],
    };

    try {
      // Verificar tamanho de bundle (se aplicável)
      await this.checkBundleSize(analysis);

      // Verificar tempo de resposta do servidor
      if (this.detection.activePorts.length > 0) {
        await this.checkServerResponse(analysis);
      }

      // Verificar configurações de performance
      await this.checkPerformanceConfigs(analysis);
    } catch (error) {
      analysis.score = 80;
      analysis.issues.push(`Erro na análise de performance: ${error.message}`);
    }

    return analysis;
  }

  /**
   * ✨ Analisa qualidade do código
   */
  async analyzeQuality() {
    const analysis = {
      score: 100,
      linting: false,
      formatting: false,
      typeChecking: false,
      preCommitHooks: false,
      issues: [],
    };

    try {
      const packageJson = await fs.readJson(this.packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Verificar ESLint
      analysis.linting = !!(
        allDeps.eslint ||
        (await fs.pathExists(".eslintrc.js")) ||
        (await fs.pathExists(".eslintrc.json"))
      );
      if (!analysis.linting) {
        analysis.score -= 15;
        analysis.issues.push("ESLint não configurado");
      }

      // Verificar Prettier
      analysis.formatting = !!(
        allDeps.prettier ||
        (await fs.pathExists(".prettierrc")) ||
        (await fs.pathExists("prettier.config.js"))
      );
      if (!analysis.formatting) {
        analysis.score -= 10;
        analysis.issues.push("Prettier não configurado");
      }

      // Verificar TypeScript
      analysis.typeChecking = this.detection.features.typescript;
      if (!analysis.typeChecking) {
        analysis.score -= 10;
        analysis.issues.push("TypeScript não configurado");
      }

      // Verificar hooks pre-commit
      analysis.preCommitHooks = !!(
        allDeps.husky ||
        allDeps["lint-staged"] ||
        (await fs.pathExists(".husky"))
      );
      if (!analysis.preCommitHooks) {
        analysis.score -= 10;
        analysis.issues.push("Pre-commit hooks não configurados");
      }

      // Verificar estrutura de pastas
      await this.checkProjectStructure(analysis);
    } catch (error) {
      analysis.score = 70;
      analysis.issues.push(`Erro na análise de qualidade: ${error.message}`);
    }

    return analysis;
  }

  /**
   * 🧪 Analisa configuração de testes
   */
  async analyzeTesting() {
    const analysis = {
      score: 100,
      framework: null,
      coverage: 0,
      testFiles: 0,
      e2eTests: false,
      issues: [],
    };

    try {
      // Detectar framework de testes
      analysis.framework = this.detection.features.testing[0] || null;

      if (!analysis.framework) {
        analysis.score = 20;
        analysis.issues.push("Nenhum framework de testes configurado");
        return analysis;
      }

      // Contar arquivos de teste
      const testPatterns = [
        "**/*.test.js",
        "**/*.test.ts",
        "**/*.spec.js",
        "**/*.spec.ts",
        "**/__tests__/**/*.js",
        "**/__tests__/**/*.ts",
      ];

      let testCount = 0;
      for (const pattern of testPatterns) {
        try {
          const files = await import("glob").then((glob) =>
            glob.glob(pattern, {
              cwd: this.projectRoot,
              ignore: ["node_modules/**"],
            })
          );
          testCount += files.length;
        } catch (error) {
          // Ignorar erros de glob
        }
      }

      analysis.testFiles = testCount;

      if (testCount === 0) {
        analysis.score = 30;
        analysis.issues.push("Nenhum arquivo de teste encontrado");
      } else if (testCount < 5) {
        analysis.score -= 20;
        analysis.issues.push("Poucos arquivos de teste");
      }

      // Verificar testes E2E
      const e2eFrameworks = ["cypress", "playwright", "puppeteer"];
      analysis.e2eTests = e2eFrameworks.some((fw) =>
        this.detection.stack.includes(fw)
      );

      if (!analysis.e2eTests && this.detection.type !== "node-api") {
        analysis.score -= 15;
        analysis.issues.push("Testes E2E não configurados");
      }

      // Verificar coverage (estimativa baseada em configuração)
      const hasCoverageConfig = await this.checkCoverageConfig();
      if (!hasCoverageConfig) {
        analysis.score -= 10;
        analysis.issues.push("Coverage não configurado");
      } else {
        // Estimativa baseada no número de testes vs arquivos
        analysis.coverage = Math.min(
          (testCount / Math.max(this.detection.files.source.length, 1)) * 100,
          90
        );
      }
    } catch (error) {
      analysis.score = 50;
      analysis.issues.push(`Erro na análise de testes: ${error.message}`);
    }

    return analysis;
  }

  /**
   * 🧮 Calcula score geral baseado nas categorias
   */
  calculateOverallScore(results) {
    const weights = {
      dependencies: 0.2,
      security: 0.25,
      performance: 0.2,
      quality: 0.2,
      testing: 0.15,
    };

    return Math.round(
      results.dependencies.score * weights.dependencies +
        results.security.score * weights.security +
        results.performance.score * weights.performance +
        results.quality.score * weights.quality +
        results.testing.score * weights.testing
    );
  }

  /**
   * 🔍 Consolida issues críticos e warnings
   */
  consolidateIssues(results) {
    // Issues críticos (score < 50)
    Object.entries(results).forEach(([category, data]) => {
      if (data.score !== undefined && data.score < 50) {
        results.criticalIssues.push(`${category}: ${data.issues.join(", ")}`);
      }
    });

    // Warnings (score 50-70)
    Object.entries(results).forEach(([category, data]) => {
      if (data.score !== undefined && data.score >= 50 && data.score < 70) {
        results.warnings.push(`${category}: ${data.issues.join(", ")}`);
      }
    });

    // Sugestões gerais
    if (results.overallScore >= 80) {
      results.suggestions.push("Configurar monitoramento contínuo");
      results.suggestions.push("Adicionar documentação automática");
    } else if (results.overallScore >= 60) {
      results.suggestions.push("Priorizar correção de issues de segurança");
      results.suggestions.push("Melhorar cobertura de testes");
    } else {
      results.suggestions.push("Focar em issues críticos primeiro");
      results.suggestions.push(
        "Considerar refatoração para melhorar qualidade"
      );
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  async checkSecurityConfigs(analysis) {
    // Verificar se usa HTTPS
    const packageJson = await fs.readJson(this.packageJsonPath);

    if (this.detection.type === "node-api") {
      // Verificar helmet, cors, etc.
      const securityPackages = ["helmet", "cors", "express-rate-limit"];
      const missing = securityPackages.filter(
        (pkg) => !this.detection.stack.includes(pkg)
      );

      analysis.configIssues = missing;
      analysis.score -= missing.length * 5;

      if (missing.length > 0) {
        analysis.issues.push(
          `Pacotes de segurança ausentes: ${missing.join(", ")}`
        );
      }
    }
  }

  async checkSecurityHeaders(analysis) {
    try {
      const port = this.detection.activePorts[0];
      const response = await axios.get(`http://localhost:${port}`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      const requiredHeaders = [
        "x-content-type-options",
        "x-frame-options",
        "x-xss-protection",
      ];

      analysis.missingHeaders = requiredHeaders.filter(
        (header) => !response.headers[header]
      );

      if (analysis.missingHeaders.length > 0) {
        analysis.score -= analysis.missingHeaders.length * 3;
        analysis.issues.push(
          `Headers de segurança ausentes: ${analysis.missingHeaders.length}`
        );
      }
    } catch (error) {
      // Não conseguiu verificar headers, não é crítico
    }
  }

  async checkBundleSize(analysis) {
    // Verificar se há build directory
    const buildDirs = ["dist", "build", ".next"];

    for (const dir of buildDirs) {
      const buildPath = path.join(this.projectRoot, dir);
      if (await fs.pathExists(buildPath)) {
        try {
          const stats = await fs.stat(buildPath);
          // Estimativa grosseira de tamanho
          analysis.bundleSize = `~${Math.round(stats.size / 1024 / 1024)}MB`;
          break;
        } catch (error) {
          // Ignorar erros
        }
      }
    }
  }

  async checkServerResponse(analysis) {
    try {
      const port = this.detection.activePorts[0];
      const startTime = Date.now();

      await axios.get(`http://localhost:${port}`, {
        timeout: 10000,
        validateStatus: () => true,
      });

      const responseTime = Date.now() - startTime;
      analysis.serverResponse = `${responseTime}ms`;

      if (responseTime > 2000) {
        analysis.score -= 10;
        analysis.issues.push("Tempo de resposta alto (>2s)");
      }
    } catch (error) {
      analysis.issues.push("Servidor não respondeu");
      analysis.score -= 5;
    }
  }

  async checkPerformanceConfigs(analysis) {
    // Verificar configurações específicas por tipo
    if (this.detection.type === "nextjs") {
      const configPath = path.join(this.projectRoot, "next.config.js");
      if (await fs.pathExists(configPath)) {
        // Poderia analisar configurações específicas
        analysis.suggestions.push("Verificar otimizações do Next.js config");
      }
    }
  }

  async checkProjectStructure(analysis) {
    // Verificar estrutura básica esperada
    const expectedDirs = {
      nextjs: ["app", "pages", "public"],
      react: ["src", "public"],
      "node-api": ["src", "routes", "controllers"],
    };

    const expected = expectedDirs[this.detection.type] || [];
    const missing = [];

    for (const dir of expected) {
      if (!(await fs.pathExists(path.join(this.projectRoot, dir)))) {
        missing.push(dir);
      }
    }

    if (missing.length > 0) {
      analysis.score -= missing.length * 3;
      analysis.issues.push(`Estrutura atípica: faltam ${missing.join(", ")}`);
    }
  }

  async checkCoverageConfig() {
    const coverageConfigs = [
      "jest.config.js",
      "vitest.config.js",
      ".nycrc",
      "coverage",
    ];

    for (const config of coverageConfigs) {
      if (await fs.pathExists(path.join(this.projectRoot, config))) {
        return true;
      }
    }

    // Verificar package.json para config de coverage
    try {
      const packageJson = await fs.readJson(this.packageJsonPath);
      return !!(
        packageJson.jest?.collectCoverage || packageJson.vitest?.coverage
      );
    } catch (error) {
      return false;
    }
  }
}

export default HealthAnalyzer;
