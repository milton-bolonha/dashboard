/**
 * 🔍 Project Detector - Auto-detecta tipo e configuração de projetos
 * Analisa arquivos, dependências e estrutura para identificar o stack tecnológico
 */

import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import axios from "axios";
import config from "../ai.config.js";

export class ProjectDetector {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packageJsonPath = path.join(projectRoot, "package.json");
    this.detectionResults = null;
  }

  /**
   * 🎯 Método principal - detecta tudo sobre o projeto
   */
  async detect() {
    if (this.detectionResults) {
      return this.detectionResults;
    }

    console.log("🔍 Detectando tipo de projeto...");

    const results = {
      type: "generic",
      subtype: null,
      confidence: 0,
      stack: [],
      ports: [],
      activePorts: [],
      packageJson: null,
      files: {
        config: [],
        source: [],
        tests: [],
      },
      features: {
        typescript: false,
        testing: [],
        linting: false,
        formatting: false,
        bundler: null,
      },
      suggestions: [],
    };

    try {
      // 1. Analisar package.json
      await this.analyzePackageJson(results);

      // 2. Analisar estrutura de arquivos
      await this.analyzeFileStructure(results);

      // 3. Detectar tipo de projeto
      await this.detectProjectType(results);

      // 4. Detectar portas ativas
      await this.detectActivePorts(results);

      // 5. Analisar features
      await this.analyzeFeatures(results);

      // 6. Gerar sugestões
      this.generateSuggestions(results);

      this.detectionResults = results;

      console.log(
        `✅ Projeto detectado: ${results.type}${
          results.subtype ? ` (${results.subtype})` : ""
        }`
      );
      console.log(`🎯 Confiança: ${results.confidence}%`);

      return results;
    } catch (error) {
      console.error("❌ Erro na detecção:", error.message);
      return results;
    }
  }

  /**
   * 📦 Analisa package.json para extrair dependências e scripts
   */
  async analyzePackageJson(results) {
    if (!(await fs.pathExists(this.packageJsonPath))) {
      results.suggestions.push(
        "Criar package.json para gerenciar dependências"
      );
      return;
    }

    try {
      const packageJson = await fs.readJson(this.packageJsonPath);
      results.packageJson = packageJson;

      // Analisar dependências
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      results.stack = Object.keys(allDeps);

      // Identificar frameworks principais
      if (allDeps.next) {
        results.type = "nextjs";
        results.confidence += 30;
      } else if (allDeps.react && allDeps["react-dom"]) {
        results.type = "react";
        results.confidence += 25;
      } else if (allDeps.vue) {
        results.type = "vue";
        results.confidence += 25;
      } else if (allDeps.express || allDeps.fastify || allDeps.koa) {
        results.type = "node-api";
        results.confidence += 20;
      }

      // Detectar bundlers
      if (allDeps.vite) {
        results.features.bundler = "vite";
        results.confidence += 10;
      } else if (allDeps.webpack) {
        results.features.bundler = "webpack";
        results.confidence += 5;
      }

      // Detectar TypeScript
      if (allDeps.typescript || allDeps["@types/node"]) {
        results.features.typescript = true;
        results.confidence += 10;
      }

      // Detectar testing frameworks
      const testingFrameworks = [];
      if (allDeps.jest) testingFrameworks.push("jest");
      if (allDeps.vitest) testingFrameworks.push("vitest");
      if (allDeps.cypress) testingFrameworks.push("cypress");
      if (allDeps.playwright) testingFrameworks.push("playwright");
      results.features.testing = testingFrameworks;

      // Detectar linting/formatting
      if (allDeps.eslint) results.features.linting = true;
      if (allDeps.prettier) results.features.formatting = true;
    } catch (error) {
      console.warn("⚠️ Erro ao ler package.json:", error.message);
    }
  }

  /**
   * 📁 Analisa estrutura de arquivos do projeto
   */
  async analyzeFileStructure(results) {
    try {
      const patterns = config.detection.patterns;

      for (const [projectType, pattern] of Object.entries(patterns)) {
        let typeConfidence = 0;

        // Verificar arquivos específicos
        for (const file of pattern.files) {
          if (await fs.pathExists(path.join(this.projectRoot, file))) {
            typeConfidence += 15;
            results.files.config.push(file);
          }
        }

        // Verificar diretórios indicadores
        for (const indicator of pattern.indicators) {
          if (await fs.pathExists(path.join(this.projectRoot, indicator))) {
            typeConfidence += 10;
            results.files.source.push(indicator);
          }
        }

        // Se este tipo tem mais confiança, atualize
        if (
          typeConfidence > 0 &&
          (results.confidence === 0 ||
            typeConfidence > results.confidence * 0.7)
        ) {
          if (
            results.type === "generic" ||
            typeConfidence > results.confidence
          ) {
            results.type = projectType;
            results.confidence = Math.max(results.confidence, typeConfidence);
          }
        }
      }

      // Detectar arquivos de teste
      const testFiles = await glob("**/*.{test,spec}.{js,ts,tsx,jsx}", {
        cwd: this.projectRoot,
        ignore: ["node_modules/**", "dist/**", "build/**"],
      });
      results.files.tests = testFiles;
    } catch (error) {
      console.warn("⚠️ Erro ao analisar estrutura:", error.message);
    }
  }

  /**
   * 🎯 Detecta tipo específico baseado em análise combinada
   */
  async detectProjectType(results) {
    // Refinamentos baseados em combinações específicas
    if (results.type === "react") {
      // Verificar se é Create React App ou Vite
      if (
        await fs.pathExists(path.join(this.projectRoot, "public/index.html"))
      ) {
        results.subtype = "create-react-app";
      } else if (results.features.bundler === "vite") {
        results.subtype = "vite-react";
      }
    }

    if (results.type === "nextjs") {
      // Verificar se usa App Router ou Pages Router
      if (await fs.pathExists(path.join(this.projectRoot, "app"))) {
        results.subtype = "app-router";
        results.confidence += 10;
      } else if (await fs.pathExists(path.join(this.projectRoot, "pages"))) {
        results.subtype = "pages-router";
        results.confidence += 5;
      }
    }

    if (results.type === "node-api") {
      // Verificar framework específico
      if (results.stack.includes("express")) {
        results.subtype = "express";
      } else if (results.stack.includes("fastify")) {
        results.subtype = "fastify";
      } else if (results.stack.includes("koa")) {
        results.subtype = "koa";
      }
    }

    // Garantir confiança mínima
    if (results.confidence < 30 && results.type !== "generic") {
      results.type = "generic";
      results.confidence = 20;
    }
  }

  /**
   * 🌐 Detecta portas ativas do projeto
   */
  async detectActivePorts(results) {
    const possiblePorts = config.detection.defaultPorts[results.type] || [
      3000, 8000, 4000,
    ];

    results.ports = possiblePorts;

    for (const port of possiblePorts) {
      try {
        const response = await axios.get(`http://localhost:${port}`, {
          timeout: 2000,
          validateStatus: () => true, // Aceita qualquer status
        });

        if (response.status < 500) {
          results.activePorts.push(port);
          console.log(`✅ Porta ${port} ativa`);
        }
      } catch (error) {
        // Porta não está ativa, tudo bem
      }
    }

    if (results.activePorts.length === 0) {
      results.suggestions.push(
        `Iniciar servidor de desenvolvimento (portas recomendadas: ${possiblePorts.join(
          ", "
        )})`
      );
    }
  }

  /**
   * ⚙️ Analisa features avançadas do projeto
   */
  async analyzeFeatures(results) {
    // Verificar configurações específicas
    const configFiles = [
      "tsconfig.json",
      "eslint.config.js",
      ".eslintrc.js",
      "prettier.config.js",
      "tailwind.config.js",
      "vite.config.js",
      "next.config.js",
    ];

    for (const configFile of configFiles) {
      if (await fs.pathExists(path.join(this.projectRoot, configFile))) {
        results.files.config.push(configFile);

        // Boost de confiança para configs específicos
        if (configFile === "next.config.js" && results.type === "nextjs") {
          results.confidence += 15;
        }
        if (
          configFile === "vite.config.js" &&
          results.features.bundler === "vite"
        ) {
          results.confidence += 10;
        }
      }
    }

    // Capear confiança em 100%
    results.confidence = Math.min(results.confidence, 100);
  }

  /**
   * 💡 Gera sugestões baseadas na análise
   */
  generateSuggestions(results) {
    // Sugestões baseadas no tipo detectado
    if (results.type === "nextjs") {
      if (!results.features.typescript) {
        results.suggestions.push(
          "Considerar migrar para TypeScript para melhor experiência de desenvolvimento"
        );
      }
      if (!results.features.testing.length) {
        results.suggestions.push(
          "Adicionar framework de testes (recomendado: Jest + Testing Library)"
        );
      }
    }

    if (results.type === "react") {
      if (!results.features.testing.length) {
        results.suggestions.push(
          "Configurar testes com Jest e React Testing Library"
        );
      }
      if (!results.features.linting) {
        results.suggestions.push("Configurar ESLint para React");
      }
    }

    if (results.type === "node-api") {
      if (!results.features.testing.length) {
        results.suggestions.push("Adicionar testes com Jest ou Vitest");
      }
      if (!results.features.typescript) {
        results.suggestions.push(
          "Considerar TypeScript para APIs mais robustas"
        );
      }
    }

    // Sugestões gerais
    if (!results.features.linting) {
      results.suggestions.push(
        "Configurar ESLint para melhor qualidade de código"
      );
    }

    if (!results.features.formatting) {
      results.suggestions.push(
        "Configurar Prettier para formatação consistente"
      );
    }
  }

  /**
   * 📊 Retorna um resumo da detecção
   */
  getSummary() {
    if (!this.detectionResults) {
      return "Nenhuma detecção realizada ainda";
    }

    const { type, subtype, confidence, stack, activePorts, features } =
      this.detectionResults;

    return {
      project: `${type}${subtype ? ` (${subtype})` : ""}`,
      confidence: `${confidence}%`,
      mainDependencies: stack.slice(0, 5),
      activePorts: activePorts.length ? activePorts : "Nenhuma",
      features: {
        typescript: features.typescript ? "✅" : "❌",
        testing: features.testing.length ? features.testing.join(", ") : "❌",
        linting: features.linting ? "✅" : "❌",
      },
    };
  }
}

export default ProjectDetector;
