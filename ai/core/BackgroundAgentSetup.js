/**
 * 🤖 Background Agent Setup - Configuração automática para Cursor
 * Gera environment.json otimizado para cada tipo de projeto
 */

import fs from "fs-extra";
import path from "path";

export class BackgroundAgentSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🚀 Gera configuração de environment para background agents
   */
  async generateEnvironment() {
    await fs.ensureDir(this.cursorDir);

    const environmentConfig = {
      ...this.getBaseEnvironment(),
      ...this.getProjectSpecificEnvironment(),
      ...this.getSecuritySettings(),
    };

    const envPath = path.join(this.cursorDir, "environment.json");
    await fs.writeJson(envPath, environmentConfig, { spaces: 2 });

    return environmentConfig;
  }

  /**
   * 🏗️ Configuração base para todos os projetos
   */
  getBaseEnvironment() {
    return {
      version: "1.0",
      name: `${this.detection.type}-environment`,
      description: `Auto-generated environment for ${this.detection.type} project`,

      // Configuração base do sistema
      base: {
        image: "ubuntu:22.04",
        packages: ["curl", "git", "build-essential", "python3", "python3-pip"],
      },

      // Node.js sempre necessário
      node: {
        version: this.detectNodeVersion(),
        package_manager: this.detectPackageManager(),
      },
    };
  }

  /**
   * 🎯 Configuração específica por tipo de projeto
   */
  getProjectSpecificEnvironment() {
    const configs = {
      nextjs: this.getNextJSEnvironment(),
      react: this.getReactEnvironment(),
      vue: this.getVueEnvironment(),
      "node-api": this.getNodeAPIEnvironment(),
      generic: this.getGenericEnvironment(),
    };

    return configs[this.detection.type] || configs.generic;
  }

  /**
   * 🚀 Ambiente Next.js
   */
  getNextJSEnvironment() {
    return {
      install: this.getInstallCommand(),

      start: "echo 'Starting Next.js environment...'",

      terminals: [
        {
          name: "Next.js Dev Server",
          command: "npm run dev",
        },
        {
          name: "TypeScript Watch",
          command: this.detection.features.typescript
            ? "npx tsc --watch --noEmit"
            : null,
        },
        {
          name: "Tests",
          command: this.getTestCommand(),
        },
      ].filter((terminal) => terminal.command),

      environment: {
        NODE_ENV: "development",
        NEXT_TELEMETRY_DISABLED: "1",
      },

      ports: [3000, 3001],

      healthcheck: {
        url: "http://localhost:3000",
        timeout: 30000,
      },

      specific_setup: [
        "# Next.js specific optimizations",
        "echo 'Configuring Next.js environment...'",
        "npm install --prefer-offline --no-audit",
        ...(this.detection.subtype === "app-router"
          ? ["echo 'App Router detected - enabling experimental features'"]
          : []),
      ],
    };
  }

  /**
   * ⚛️ Ambiente React
   */
  getReactEnvironment() {
    return {
      install: this.getInstallCommand(),

      start: "echo 'Starting React environment...'",

      terminals: [
        {
          name: "React Dev Server",
          command:
            this.detection.subtype === "vite-react"
              ? "npm run dev"
              : "npm start",
        },
        {
          name: "TypeScript",
          command: this.detection.features.typescript
            ? "npx tsc --watch --noEmit"
            : null,
        },
        {
          name: "Tests",
          command: this.getTestCommand(),
        },
      ].filter((terminal) => terminal.command),

      environment: {
        NODE_ENV: "development",
        BROWSER: "none",
        CI: "true",
      },

      ports: this.detection.subtype === "vite-react" ? [5173] : [3000],

      healthcheck: {
        url:
          this.detection.subtype === "vite-react"
            ? "http://localhost:5173"
            : "http://localhost:3000",
        timeout: 30000,
      },
    };
  }

  /**
   * 🟢 Ambiente Vue.js
   */
  getVueEnvironment() {
    return {
      install: this.getInstallCommand(),

      start: "echo 'Starting Vue environment...'",

      terminals: [
        {
          name: "Vue Dev Server",
          command: "npm run dev",
        },
        {
          name: "TypeScript",
          command: this.detection.features.typescript
            ? "vue-tsc --watch --noEmit"
            : null,
        },
        {
          name: "Tests",
          command: this.getTestCommand(),
        },
      ].filter((terminal) => terminal.command),

      environment: {
        NODE_ENV: "development",
      },

      ports: [8080, 5173],

      healthcheck: {
        url: "http://localhost:8080",
        timeout: 30000,
      },
    };
  }

  /**
   * 🌐 Ambiente Node.js API
   */
  getNodeAPIEnvironment() {
    return {
      install: this.getInstallCommand(),

      start:
        this.detection.subtype === "express"
          ? "echo 'Starting Express API environment...'"
          : "echo 'Starting Node.js API environment...'",

      terminals: [
        {
          name: "API Server",
          command: "npm run dev || npm run start",
        },
        {
          name: "Database",
          command: this.getDatabaseCommand(),
        },
        {
          name: "Tests",
          command: this.getTestCommand(),
        },
      ].filter((terminal) => terminal.command),

      environment: {
        NODE_ENV: "development",
        PORT: "3000",
      },

      ports: [3000, 8000, 4000],

      healthcheck: {
        url: "http://localhost:3000/health",
        fallback_url: "http://localhost:3000",
        timeout: 30000,
      },
    };
  }

  /**
   * 🔧 Ambiente genérico
   */
  getGenericEnvironment() {
    return {
      install: this.getInstallCommand(),

      start: "echo 'Starting generic Node.js environment...'",

      terminals: [
        {
          name: "Development",
          command: "npm run dev || npm start",
        },
        {
          name: "Tests",
          command: this.getTestCommand(),
        },
      ].filter((terminal) => terminal.command),

      environment: {
        NODE_ENV: "development",
      },

      ports: [3000],

      healthcheck: {
        url: "http://localhost:3000",
        timeout: 30000,
      },
    };
  }

  /**
   * 🔒 Configurações de segurança
   */
  getSecuritySettings() {
    return {
      security: {
        allowed_domains: [
          "github.com",
          "npmjs.com",
          "nodejs.org",
          "cdn.jsdelivr.net",
          "unpkg.com",
        ],

        blocked_commands: [
          "rm -rf /*",
          "rm -rf ~/",
          "dd if=/dev/zero",
          ":(){ :|:& };:",
          "wget * | sh",
          "curl * | sh",
        ],

        environment_variables: {
          // Secrets que podem ser necessários
          required: [],
          optional: ["DATABASE_URL", "API_KEY", "JWT_SECRET"],
        },
      },
    };
  }

  /**
   * 🔍 Detecta versão do Node.js
   */
  detectNodeVersion() {
    try {
      const packageJson = require(path.join(this.projectRoot, "package.json"));
      if (packageJson.engines?.node) {
        return packageJson.engines.node;
      }
    } catch (error) {
      // Ignorar erro
    }

    return ">=18.0.0"; // Default seguro
  }

  /**
   * 📦 Detecta package manager
   */
  detectPackageManager() {
    const managers = [
      { file: "pnpm-lock.yaml", manager: "pnpm" },
      { file: "yarn.lock", manager: "yarn" },
      { file: "package-lock.json", manager: "npm" },
    ];

    for (const { file, manager } of managers) {
      if (fs.existsSync(path.join(this.projectRoot, file))) {
        return manager;
      }
    }

    return "npm"; // Default
  }

  /**
   * 📜 Gera comando de instalação
   */
  getInstallCommand() {
    const packageManager = this.detectPackageManager();

    const commands = {
      npm: "npm ci --prefer-offline --no-audit",
      yarn: "yarn install --frozen-lockfile",
      pnpm: "pnpm install --frozen-lockfile",
    };

    return commands[packageManager] || commands.npm;
  }

  /**
   * 🧪 Gera comando de teste
   */
  getTestCommand() {
    if (this.detection.features.testing.length === 0) {
      return null;
    }

    const framework = this.detection.features.testing[0];

    const commands = {
      jest: "npm run test -- --watch",
      vitest: "npm run test -- --watch",
      cypress: "npm run cy:open",
      playwright: "npm run test:e2e",
    };

    return commands[framework] || "npm test";
  }

  /**
   * 🗄️ Gera comando de database (se aplicável)
   */
  getDatabaseCommand() {
    if (this.detection.type !== "node-api") {
      return null;
    }

    // Detectar se usa Docker Compose
    if (fs.existsSync(path.join(this.projectRoot, "docker-compose.yml"))) {
      return "docker-compose up -d db";
    }

    // Detectar dependências de database
    const dbDeps = ["postgres", "mysql2", "sqlite3", "mongodb"];
    const hasDbDep = dbDeps.some((dep) => this.detection.stack.includes(dep));

    if (hasDbDep) {
      return "echo 'Database detected - configure connection manually'";
    }

    return null;
  }

  /**
   * 📋 Gera documentação da configuração
   */
  generateDocumentation() {
    return `# Background Agent Environment

This environment was auto-generated for your ${this.detection.type} project.

## Configuration

- **Project Type**: ${this.detection.type}${
      this.detection.subtype ? ` (${this.detection.subtype})` : ""
    }
- **Package Manager**: ${this.detectPackageManager()}
- **Node Version**: ${this.detectNodeVersion()}
- **TypeScript**: ${this.detection.features.typescript ? "Yes" : "No"}
- **Testing**: ${this.detection.features.testing.join(", ") || "None"}

## Available Terminals

The background agent will start these terminals automatically:

${
  this.getProjectSpecificEnvironment()
    .terminals?.map((t) => `- **${t.name}**: \`${t.command}\``)
    .join("\n") || "- No terminals configured"
}

## Ports

The following ports will be available:

${
  this.getProjectSpecificEnvironment()
    .ports?.map((port) => `- ${port}`)
    .join("\n") || "- No specific ports"
}

## Usage

1. The agent will clone your repo
2. Run the install command to set up dependencies  
3. Start the configured terminals
4. Begin working on your project

## Security

- Internet access is enabled for package installation
- Blocked dangerous commands for safety
- Environment variables are encrypted at rest

## Customization

Edit \`.cursor/environment.json\` to customize this configuration.
`;
  }
}

export default BackgroundAgentSetup;
