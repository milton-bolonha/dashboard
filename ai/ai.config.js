/**
 * 🤖 AI Development Workspace - Configuração Central
 * Framework genérico para automação inteligente em projetos Node.js
 */

import path from "path";

export default {
  // ============ INFORMAÇÕES DO FRAMEWORK ============
  version: "1.0.0",
  name: "AI Dev Workspace",

  // ============ DETECÇÃO AUTOMÁTICA DE PROJETO ============
  detection: {
    // Padrões para detecção automática do tipo de projeto
    patterns: {
      nextjs: {
        files: ["next.config.js", "next.config.mjs", "next.config.ts"],
        dependencies: ["next"],
        indicators: ["app/", "pages/", ".next/"],
      },
      react: {
        files: ["src/App.js", "src/App.tsx", "public/index.html"],
        dependencies: ["react", "react-dom"],
        indicators: ["src/components/", "src/hooks/"],
      },
      vue: {
        files: ["vue.config.js", "vite.config.js"],
        dependencies: ["vue", "@vue/cli"],
        indicators: ["src/views/", "src/router/"],
      },
      "node-api": {
        files: ["server.js", "app.js", "index.js"],
        dependencies: ["express", "fastify", "koa"],
        indicators: ["routes/", "controllers/", "middleware/"],
      },
      vite: {
        files: ["vite.config.js", "vite.config.ts"],
        dependencies: ["vite"],
        indicators: ["src/", "dist/"],
      },
    },

    // Portas comuns para cada tipo de projeto
    defaultPorts: {
      nextjs: [3000, 3001],
      react: [3000, 3001, 5173],
      vue: [8080, 3000, 5173],
      "node-api": [3000, 8000, 4000],
      vite: [5173, 3000],
    },
  },

  // ============ CONFIGURAÇÃO DE ANÁLISE VISUAL ============
  visual: {
    screenshot: {
      defaultViewport: { width: 1920, height: 1080 },
      outputDir: path.join(
        process.env.AI_OUTPUT_DIR || path.join(".ai-workspace", "outputs"),
        "screenshots"
      ),
      formats: ["png"],
      options: {
        fullPage: true,
        deviceScaleFactor: 1,
      },
    },

    // Seletores genéricos para detecção de componentes
    selectors: {
      components: [
        "[class*='component']",
        "[class*='card']",
        "[data-testid]",
        "[data-cy]",
        ".card",
        ".component",
      ],
      forms: ["form", "[role='form']", "[class*='form']"],
      navigation: [
        "nav",
        "nav a",
        ".nav-link",
        "[role='tab']",
        "[role='menuitem']",
        ".navbar",
        ".menu",
      ],
      buttons: [
        "button",
        "[role='button']",
        "input[type='submit']",
        "input[type='button']",
        ".btn",
        ".button",
      ],
      inputs: [
        "input",
        "textarea",
        "select",
        "[role='textbox']",
        "[role='combobox']",
      ],
    },
  },

  // ============ CONFIGURAÇÃO DE TESTES ============
  testing: {
    frameworks: {
      jest: {
        configFiles: ["jest.config.js", "jest.config.json"],
        testPatterns: ["**/*.test.js", "**/*.test.ts", "**/*.spec.js"],
      },
      vitest: {
        configFiles: ["vitest.config.js", "vitest.config.ts"],
        testPatterns: ["**/*.test.js", "**/*.test.ts"],
      },
      cypress: {
        configFiles: ["cypress.config.js", "cypress.json"],
        testPatterns: ["cypress/**/*.cy.js", "cypress/**/*.spec.js"],
      },
    },

    scenarios: [
      "load-test", // Teste de carregamento básico
      "navigation", // Teste de navegação
      "forms", // Teste de formulários
      "responsive", // Teste responsivo
      "accessibility", // Teste de acessibilidade
      "performance", // Teste de performance
    ],
  },

  // ============ CONFIGURAÇÃO DO CURSOR ============
  cursor: {
    rules: {
      outputDir: ".cursor/rules",
      templates: "templates/cursor-rules",
    },

    notepads: {
      outputDir: ".cursor/notepads",
      templates: "templates/notepads",
    },

    docs: {
      // URLs de documentação por stack
      nextjs: ["https://nextjs.org/docs", "https://react.dev/reference/react"],
      react: [
        "https://react.dev/reference/react",
        "https://reactrouter.com/en/main",
      ],
      vue: ["https://vuejs.org/guide/", "https://router.vuejs.org/"],
      "node-api": [
        "https://expressjs.com/en/api.html",
        "https://nodejs.org/docs/latest/api/",
      ],
    },
  },

  // ============ CONFIGURAÇÃO DE OUTPUTS ============
  outputs: {
    baseDir: process.env.AI_OUTPUT_DIR || path.join(".ai-workspace", "outputs"),
    structure: {
      screenshots: "screenshots",
      reports: "reports",
      logs: "logs",
      artifacts: "artifacts",
    },

    // Organização por data (YYYY-MM)
    dateOrganized: true,

    // Limpeza automática
    cleanup: {
      maxAge: "30d",
      maxFiles: 1000,
    },
  },

  // ============ CONFIGURAÇÃO DE LOGGING ============
  logging: {
    level: "info",
    format: "json",
    outputs: {
      console: true,
      file: {
        enabled: true,
        path: path.join(
          process.env.AI_OUTPUT_DIR || path.join(".ai-workspace", "outputs"),
          "logs"
        ),
        maxSize: "10MB",
        maxFiles: 5,
      },
    },
  },

  // ============ CONFIGURAÇÃO DE AUTOMAÇÃO ============
  automation: {
    healthCheck: {
      interval: 300000, // 5 minutos
      timeout: 30000, // 30 segundos
      retries: 3,
    },

    monitoring: {
      enabled: false, // Deve ser habilitado explicitamente
      interval: 600000, // 10 minutos
    },
  },

  // ============ TEMPLATES POR STACK ============
  templates: {
    rules: {
      base: "templates/cursor-rules/base.cursor",
      nextjs: "templates/cursor-rules/nextjs.cursor",
      react: "templates/cursor-rules/react.cursor",
      vue: "templates/cursor-rules/vue.cursor",
      "node-api": "templates/cursor-rules/node-api.cursor",
    },

    tests: {
      unit: "templates/tests/unit",
      integration: "templates/tests/integration",
      e2e: "templates/tests/e2e",
    },
  },
};
