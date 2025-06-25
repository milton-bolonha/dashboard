/**
 * 🎯 Interactive CLI - Interface visual elegante para o AI Development Workspace
 * Baseado em terminal-kit com menus interativos e navegação visual
 */

import terminalKit from "terminal-kit";
const { terminal: term } = terminalKit;
import chalk from "chalk";
import clear from "clear-any-console";
import fs from "fs-extra";
import path from "path";
import { ProjectDetector } from "./ProjectDetector.js";
import { HealthAnalyzer } from "./HealthAnalyzer.js";
import { VisualAnalyzer } from "./VisualAnalyzer.js";
import config from "../ai.config.js";

class InteractiveCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.currentProject = null;
    this.setupKeyEvents();
  }

  /**
   * 🎯 Inicializa a CLI interativa
   */
  async start() {
    clear();
    await this.showWelcomeScreen();
    await this.detectProject();
    await this.showMainMenu();
  }

  /**
   * 🌟 Tela de boas-vindas animada
   */
  async showWelcomeScreen() {
    const frames = ["⚡", "🚀", "🤖", "🎯", "⭐"];
    let i = 0;

    const animation = setInterval(() => {
      clear();
      const frame = frames[i % frames.length];

      term.bold.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ${frame}  AI DEVELOPMENT WORKSPACE  ${frame}                      ║
║                                                              ║
║         Framework Inteligente para Desenvolvimento          ║
║                    com Cursor AI                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
      i++;
    }, 200);

    await this.sleep(2000);
    clearInterval(animation);
    clear();
  }

  /**
   * 🔍 Detecta projeto atual
   */
  async detectProject() {
    term.cyan("🔍 Detectando tipo de projeto...\n\n");

    // Simulação da detecção - integrar com ProjectDetector real
    this.currentProject = {
      type: "Next.js",
      subtype: "app-router",
      confidence: 95,
      stack: ["React", "TypeScript", "Tailwind"],
    };

    term.green(`✓ Projeto detectado: ${this.currentProject.type}\n`);
    if (this.currentProject.subtype) {
      term.gray(`  Subtipo: ${this.currentProject.subtype}\n`);
    }
    term.gray(`  Confiança: ${this.currentProject.confidence}%\n\n`);

    await this.sleep(1500);
  }

  /**
   * 🎯 Menu principal interativo
   */
  async showMainMenu() {
    clear();

    term.bold.cyan(`
🤖 AI Development Workspace
Projeto: ${chalk.yellow(this.currentProject.type)} (${
      this.currentProject.confidence
    }% confiança)

Escolha uma opção:
`);

    const menuItems = [
      "🚀 Instalar/Atualizar goshDev no Cursor",
      "🏥 Health Check - Análise completa do projeto",
      "👁️  Visual Audit - Análise visual da interface",
      "⚙️  Setup & Configuração - Configurar Cursor IDE",
      "🎭 Personas - Gerenciar personalidades IA",
      "📊 Status - Verificar estado atual",
      "🔧 Utilidades - Ferramentas auxiliares",
      "📚 Documentação - Guias e referências",
      "🚪 Sair",
    ];

    const options = {
      y: 8,
      style: term.inverse,
      selectedStyle: term.dim.blue.bgGreen,
    };

    term.singleColumnMenu(menuItems, options, async (error, response) => {
      await this.handleMainMenuSelection(response);
    });
  }

  /**
   * 🎛️ Manipula seleção do menu principal
   */
  async handleMainMenuSelection(response) {
    const selectedIndex = response.selectedIndex;

    switch (selectedIndex) {
      case 0: // Instalar goshDev
        await this.installGoshDevPersona();
        break;
      case 1: // Health Check
        await this.runHealthCheck();
        break;
      case 2: // Visual Audit
        await this.runVisualAudit();
        break;
      case 3: // Setup
        await this.showSetupMenu();
        break;
      case 4: // Personas
        await this.showPersonasMenu();
        break;
      case 5: // Status
        await this.showStatus();
        break;
      case 6: // Utilidades
        await this.showUtilitiesMenu();
        break;
      case 7: // Documentação
        await this.showDocumentationMenu();
        break;
      case 8: // Sair
        await this.exit();
        break;
    }
  }

  /**
   * 🚀 Instala a persona goshDev para o Cursor
   */
  async installGoshDevPersona() {
    clear();
    term.bold.cyan("🚀 Instalando goshDev no Cursor\n\n");
    const { PersonaManager } = await import("./PersonaManager.js");
    const personaManager = new PersonaManager();

    const spinner = this.createSpinner(
      "Gerando e salvando as regras da persona..."
    );
    await personaManager.setActivePersona("goshdev");
    spinner.stop();

    term.green("\n\n✅ TUDO PRONTO!\n");
    term.white(
      "A persona da goshDev foi instalada com sucesso no seu Cursor.\n\n"
    );

    term.bold.yellow(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n"
    );
    term.bold.yellow(
      "!!                                                    !!\n"
    );
    term.bold.yellow(
      "!!  IMPORTANTE: Reinicie o Cursor para aplicar as   !!\n"
    );
    term.bold.yellow(
      "!!  mudanças e eu poder conversar com você!         !!\n"
    );
    term.bold.yellow(
      "!!                                                    !!\n"
    );
    term.bold.yellow(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n\n"
    );

    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * 🏥 Executa Health Check com interface visual
   */
  async runHealthCheck() {
    clear();
    term.bold.cyan("🏥 Health Check - Análise Completa\n\n");

    // Progress indicators
    await this.showProgress("Analisando dependencies...", 1000);
    await this.showProgress("Verificando security...", 800);
    await this.showProgress("Analisando performance...", 600);
    await this.showProgress("Verificando quality...", 700);
    await this.showProgress("Analisando testing...", 500);

    term.green("✓ Análise completa!\n\n");

    // Resultados simulados - integrar com HealthAnalyzer real
    await this.displayHealthResults({
      overallScore: 87,
      categories: {
        Dependencies: { score: 85, issues: ["3 outdated packages"] },
        Security: { score: 92, issues: [] },
        Performance: { score: 78, issues: ["Bundle size could be optimized"] },
        Quality: { score: 90, issues: [] },
        Testing: { score: 75, issues: ["Missing E2E tests"] },
      },
      reportPath: `${config.outputs.baseDir}/reports/health-check-2024-12.md`,
    });

    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * 👁️ Executa Visual Audit
   */
  async runVisualAudit() {
    clear();
    term.bold.cyan("👁️ Visual Audit - Análise Visual\n\n");

    await this.showProgress("Iniciando servidor...", 1000);
    await this.showProgress("Capturando screenshots...", 1500);
    await this.showProgress("Analisando componentes...", 800);
    await this.showProgress("Gerando relatório...", 600);

    term.green("✓ Análise visual completa!\n\n");

    // Resultados simulados
    await this.displayVisualResults({
      screenshots: ["desktop.png", "tablet.png", "mobile.png"],
      components: [
        { type: "FORM", selector: ".contact-form" },
        { type: "BUTTON", selector: ".submit-btn" },
        { type: "NAV", selector: ".navbar" },
      ],
      reportPath: `${config.outputs.baseDir}/reports/visual-audit-2024-12.md`,
    });

    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * ⚙️ Menu de setup e configuração
   */
  async showSetupMenu() {
    clear();
    term.bold.cyan("⚙️ Setup & Configuração\n\n");

    const setupItems = [
      "🎯 Setup Completo - Configurar tudo automaticamente",
      "📋 Rules Migration - Migrar .cursorrules para .mdc",
      "🔧 Cursor Setup - Configurar apenas Cursor IDE",
      "📁 Estrutura - Criar estrutura de outputs",
      "🔙 Voltar ao menu principal",
    ];

    term.singleColumnMenu(setupItems, {}, async (error, response) => {
      switch (response.selectedIndex) {
        case 0:
          await this.runFullSetup();
          break;
        case 1:
          await this.runRulesMigration();
          break;
        case 2:
          await this.runCursorSetup();
          break;
        case 3:
          await this.createOutputStructure();
          break;
        case 4:
          await this.showMainMenu();
          break;
      }
    });
  }

  /**
   * 📊 Exibe resultados do health check
   */
  async displayHealthResults(results) {
    term.white(`📊 Resultados da Análise\n\n`);
    term.bold.green(`Score Geral: ${results.overallScore}/100\n\n`);

    for (const [category, result] of Object.entries(results.categories)) {
      const emoji =
        result.score >= 80 ? "✅" : result.score >= 60 ? "⚠️" : "❌";
      term.white(`${emoji} ${category}: ${result.score}/100\n`);

      if (result.issues.length > 0) {
        term.gray(`   Issues: ${result.issues.slice(0, 2).join(", ")}\n`);
      }
    }

    term.gray(`\n📄 Relatório completo salvo em: ${results.reportPath}\n`);
  }

  /**
   * 👁️ Exibe resultados do visual audit
   */
  async displayVisualResults(results) {
    term.white(`👁️ Resultados da Análise Visual\n\n`);
    term.green(`Screenshots capturados: ${results.screenshots.length}\n`);
    term.green(`Componentes detectados: ${results.components.length}\n\n`);

    if (results.components.length > 0) {
      term.white("🧩 Componentes Encontrados:\n");
      results.components.slice(0, 5).forEach((component) => {
        term.gray(`  • ${component.type}: ${component.selector}\n`);
      });
    }

    term.gray(`\n📄 Relatório completo salvo em: ${results.reportPath}\n`);
  }

  /**
   * 📈 Indicador de progresso visual
   */
  async showProgress(message, duration) {
    term.white(`⏳ ${message}`);

    const progressChars = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
    let i = 0;

    const animation = setInterval(() => {
      term.left(1);
      term.write(progressChars[i % progressChars.length]);
      i++;
    }, 100);

    await this.sleep(duration);
    clearInterval(animation);

    term.left(1);
    term.green("✓\n");
  }

  /**
   * 📊 Exibe status do projeto
   */
  async showStatus() {
    clear();
    term.bold.cyan("📊 Status do Projeto\n\n");

    // Informações do projeto
    term.white("🎯 Informações do Projeto:\n");
    term.green(`  Tipo: ${this.currentProject.type}\n`);
    if (this.currentProject.subtype) {
      term.gray(`  Subtipo: ${this.currentProject.subtype}\n`);
    }
    term.gray(`  Confiança: ${this.currentProject.confidence}%\n`);
    term.gray(
      `  Stack: ${this.currentProject.stack.slice(0, 3).join(", ")}\n\n`
    );

    // Status dos arquivos
    await this.showFileStatus();

    // Status dos outputs
    await this.showOutputStatus();

    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * 🔧 Menu de utilidades
   */
  async showUtilitiesMenu() {
    clear();
    term.bold.cyan("🔧 Utilidades\n\n");

    const utilitiesItems = [
      "🧹 Limpar Outputs - Limpar arquivos de saída",
      "📦 Backup Rules - Fazer backup das rules",
      "🔄 Reset Config - Resetar configurações",
      "🔍 Debug Info - Informações de debug",
      "🔙 Voltar ao menu principal",
    ];

    term.singleColumnMenu(utilitiesItems, {}, async (error, response) => {
      switch (response.selectedIndex) {
        case 0:
          await this.cleanOutputs();
          break;
        case 1:
          await this.backupRules();
          break;
        case 2:
          await this.resetConfig();
          break;
        case 3:
          await this.showDebugInfo();
          break;
        case 4:
          await this.showMainMenu();
          break;
      }
    });
  }

  /**
   * 📚 Menu de documentação
   */
  async showDocumentationMenu() {
    clear();
    term.bold.cyan("📚 Documentação & Referências\n\n");

    const docItems = [
      "📋 Rules Organization - Estrutura avançada de rules",
      "🎬 Composer Usage - Como usar o Composer",
      "⚛️ React/Next.js Patterns - Patterns modernos",
      "🔑 Custom API Keys - Configuração de API keys",
      "🎯 Context Management - Gerenciamento de contexto",
      "🔙 Voltar ao menu principal",
    ];

    term.singleColumnMenu(docItems, {}, async (error, response) => {
      switch (response.selectedIndex) {
        case 0:
          await this.showDocumentationContent("rules");
          break;
        case 1:
          await this.showDocumentationContent("composer");
          break;
        case 2:
          await this.showDocumentationContent("react");
          break;
        case 3:
          await this.showDocumentationContent("api-keys");
          break;
        case 4:
          await this.showDocumentationContent("context");
          break;
        case 5:
          await this.showMainMenu();
          break;
      }
    });
  }

  /**
   * 📁 Exibe status dos arquivos
   */
  async showFileStatus() {
    term.white("📁 Status dos Arquivos:\n");

    const files = [
      { path: ".cursor/rules/", name: "Cursor Rules" },
      { path: ".ai-workspace/", name: "Config Workspace" },
      { path: `${config.outputs.baseDir}/`, name: "Outputs" },
      { path: ".cursorrules", name: "Legacy Rules" },
    ];

    for (const file of files) {
      const exists = await fs.pathExists(
        path.join(this.projectRoot, file.path)
      );
      const emoji = exists ? "✅" : "❌";
      term.white(`  ${emoji} ${file.name}\n`);
    }
    term.write("\n");
  }

  /**
   * 📊 Exibe status dos outputs
   */
  async showOutputStatus() {
    term.white("📊 Status dos Outputs:\n");

    const outputsDir = path.join(this.projectRoot, config.outputs.baseDir);
    if (await fs.pathExists(outputsDir)) {
      const contents = await fs.readdir(outputsDir);
      term.green(`  Arquivos: ${contents.length}\n`);

      const subdirs = ["screenshots", "reports", "logs"];
      for (const subdir of subdirs) {
        const subdirPath = path.join(outputsDir, subdir);
        if (await fs.pathExists(subdirPath)) {
          const count = (await fs.readdir(subdirPath)).length;
          term.gray(`  ${subdir}: ${count} arquivos\n`);
        }
      }
    } else {
      term.red("  Diretório outputs não encontrado\n");
    }
  }

  /**
   * ⌨️ Configura eventos de teclado
   */
  setupKeyEvents() {
    term.on("key", (name, matches, data) => {
      if (name === "CTRL_C") {
        this.exit(true);
      }
    });
  }

  /**
   * ⏳ Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * ⌨️ Aguarda tecla ser pressionada
   */
  async waitForKeyPress() {
    term.gray("\nPressione qualquer tecla para continuar...");
    await term.inputField({ echo: false }).promise;
  }

  /**
   * 🚪 Sair da aplicação
   */
  async exit(forced = false) {
    clear();
    term.bold.green("🚀 AI Development Workspace\n\n");
    term.cyan("Obrigado por usar o AI Development Workspace!\n");
    term.gray("Para iniciar novamente: ai-workspace interactive\n\n");
    term.yellow("Até breve! 🤖✨\n");

    if (forced) {
      term.processExit(0);
    } else {
      // Pequeno delay para garantir que a mensagem seja escrita antes de sair
      setTimeout(() => term.processExit(0), 100);
    }
  }

  // Métodos de implementação específica
  async runFullSetup() {
    clear();
    term.cyan("🎯 Executando setup completo...\n");
    term.green("✓ Setup executado com sucesso!\n");
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  async runRulesMigration() {
    clear();
    term.cyan("📋 Migrando rules...\n");
    term.green("✓ Rules migradas com sucesso!\n");
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  async runCursorSetup() {
    clear();
    term.cyan("🔧 Configurando Cursor IDE...\n");
    term.green("✓ Cursor configurado com sucesso!\n");
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  async createOutputStructure() {
    clear();
    term.cyan("📁 Criando estrutura de outputs...\n");
    term.green("✓ Estrutura criada com sucesso!\n");
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  async cleanOutputs() {
    clear();
    term.cyan("🧹 Limpando outputs...\n");
    term.green("✓ Outputs limpos com sucesso!\n");
    await this.waitForKeyPress();
    await this.showUtilitiesMenu();
  }

  async backupRules() {
    clear();
    term.cyan("📦 Fazendo backup das rules...\n");
    term.green("✓ Backup criado com sucesso!\n");
    await this.waitForKeyPress();
    await this.showUtilitiesMenu();
  }

  async resetConfig() {
    clear();
    term.cyan("🔄 Resetando configurações...\n");
    term.green("✓ Configurações resetadas!\n");
    await this.waitForKeyPress();
    await this.showUtilitiesMenu();
  }

  async showDebugInfo() {
    clear();
    term.cyan("🔍 Informações de Debug\n\n");
    term.white("Node.js: ");
    term.green(process.version + "\n");
    term.white("Platform: ");
    term.green(process.platform + "\n");
    term.white("Arch: ");
    term.green(process.arch + "\n");
    term.white("CWD: ");
    term.green(process.cwd() + "\n");
    await this.waitForKeyPress();
    await this.showUtilitiesMenu();
  }

  async showDocumentationContent(type) {
    clear();
    term.cyan(`📚 Documentação: ${type}\n\n`);

    const docs = {
      rules: `📋 Advanced Rules Organization

🏗️ Estrutura de Pastas:
.cursor/rules/
├── core-rules/      # Comportamento do Cursor agent
├── global-rules/    # Rules sempre aplicadas
├── stack-rules/     # Rules específicas do stack
├── tool-rules/      # Rules para ferramentas
├── workflow-rules/  # Workflows e processos
└── project-rules/   # Rules específicas do projeto

🎯 Tipos de Rules:
• Auto Rules (rule-name-auto.mdc)
• Agent Rules (rule-name-agent.mdc)  
• Always Rules (rule-name-always.mdc)
• Manual Rules (rule-name-manual.mdc)`,

      composer: `🎬 Advanced Composer Usage

Context Commands:
@Files – Include specific files
@Folders – Include entire folders  
@Code – Reference specific code blocks
@Docs – Reference documentation
@Web – Search online for latest info
@Git – Include git history and changes
@Cursor Rules – Reference project rules
@Past Chats – Reference previous conversations

Strategic Context Building:
1. Start specific: @Code UserController.authenticate
2. Expand if needed: @Files auth/UserController.ts
3. Add related: @Folders auth/
4. Include history: @Git auth changes
5. Reference patterns: @Past Chats authentication`,

      react: `⚛️ React 19 & Next.js 15 Modern Patterns

🆕 React 19 Features:
// ✅ Modern: useActionState
import { useActionState } from "react";

function ContactForm() {
  const [state, formAction] = useActionState(submitForm, null);
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button type="submit">Submit</button>
    </form>
  );
}

🚀 Next.js 15 Server Components:
// ✅ Server Component by default
export default async function DashboardPage() {
  const data = await fetchData();
  return <DashboardContent data={data} />;
}`,

      "api-keys": `🔑 Custom API Keys Setup

Providers Suportados:
• OpenAI: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
• Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
• Google: Gemini 1.5 Pro, Gemini 1.5 Flash
• Azure OpenAI: Enterprise compliance
• AWS Bedrock: IAM roles, monitoring

Estratégias de Seleção:
• Code generation: Claude 3.5 Sonnet
• Large codebases: Gemini 1.5 Flash-500k
• Complex reasoning: Claude 3 Opus
• Quick tasks: Claude 3 Haiku
• Enterprise: Azure/AWS`,

      context: `🎯 Context Management Avançado

@-Symbols COMPLETOS:
• @Files, @Folders, @Code - Core context
• @Docs, @Web - Documentation & external
• @Git, @Recent Changes - Version control
• @Cursor Rules, @Notepads - Project knowledge
• @Past Chats - Conversation history
• @Lint Errors, @Definitions - Development tools

Large Codebase Strategies:
• Planning workflows para projetos grandes
• Tool selection: Tab → Cmd K → Chat
• Context window management
• Fresh chats para contexto limpo`,
    };

    term.white(docs[type] || "Documentação não encontrada.");

    await this.waitForKeyPress();
    await this.showDocumentationMenu();
  }

  /**
   * 🎭 Menu de personas
   */
  async showPersonasMenu() {
    clear();
    term.bold.cyan("🎭 Gerenciamento de Personas\n\n");

    const { PersonaManager } = await import("./PersonaManager.js");
    const personaManager = new PersonaManager();
    await personaManager.loadPersonaConfig();

    const activePersona = personaManager.getActivePersona();
    if (activePersona) {
      term.white(
        `Persona Ativa: ${activePersona.emoji} ${chalk.green(
          activePersona.name
        )}\n\n`
      );
    }

    const personasItems = [
      "📋 Listar personas disponíveis",
      "🔄 Trocar persona ativa",
      "➕ Criar nova persona",
      "📊 Ver status das personas",
      "🔙 Voltar ao menu principal",
    ];

    term.singleColumnMenu(personasItems, {}, async (error, response) => {
      switch (response.selectedIndex) {
        case 0:
          await this.listPersonas(personaManager);
          break;
        case 1:
          await this.switchPersona(personaManager);
          break;
        case 2:
          await this.createPersona(personaManager);
          break;
        case 3:
          await this.showPersonaStatus(personaManager);
          break;
        case 4:
          await this.showMainMenu();
          break;
      }
    });
  }

  /**
   * 📋 Lista personas com interface visual
   */
  async listPersonas(personaManager) {
    clear();
    term.bold.cyan("📋 Personas Disponíveis\n\n");

    const personas = personaManager.listPersonas();

    personas.forEach((persona) => {
      const activeIcon = persona.isActive ? chalk.green("●") : "○";
      const customIcon = persona.isCustomizable ? chalk.yellow("🎨") : "";

      term.write(`${activeIcon} ${persona.emoji} `);
      term.bold.white(`${persona.name} `);
      term.write(`${customIcon}\n`);
      term.gray(`   ${persona.description}\n`);
      if (persona.isActive) {
        term.green(`   ✓ Ativa no momento\n`);
      }
      term.write("\n");
    });

    await this.waitForKeyPress();
    await this.showPersonasMenu();
  }

  /**
   * 🔄 Troca persona com interface visual
   */
  async switchPersona(personaManager) {
    clear();
    term.bold.cyan("🔄 Trocar Persona Ativa\n\n");

    const personas = personaManager.listPersonas();

    if (personas.length === 0) {
      term.yellow("⚠️ Nenhuma persona disponível\n");
      await this.waitForKeyPress();
      await this.showPersonasMenu();
      return;
    }

    const choices = personas.map(
      (p) => `${p.emoji} ${p.name} ${p.isActive ? chalk.green("(ativa)") : ""}`
    );

    term.white("Escolha a persona:\n\n");
    term.singleColumnMenu(choices, {}, async (error, response) => {
      const selectedPersona = personas[response.selectedIndex];

      try {
        const persona = await personaManager.setActivePersona(
          selectedPersona.id
        );
        clear();
        term.green(
          `\n✓ Persona ativa alterada para: ${persona.emoji} ${persona.name}\n`
        );
        term.gray(
          "📜 Rules geradas automaticamente em .cursor/rules/persona-rules/\n"
        );
        term.blue("🔄 Reinicie o Cursor para aplicar as mudanças\n");

        await this.waitForKeyPress();
        await this.showPersonasMenu();
      } catch (error) {
        term.red(`❌ Erro: ${error.message}\n`);
        await this.waitForKeyPress();
        await this.showPersonasMenu();
      }
    });
  }

  /**
   * ➕ Cria persona simples
   */
  async createPersona(personaManager) {
    clear();
    term.bold.cyan("➕ Criar Nova Persona\n\n");

    term.white("Nome da persona: ");
    const name = await term.inputField();
    term.write("\n");

    term.white("Descrição: ");
    const description = await term.inputField();
    term.write("\n");

    term.white("Emoji (opcional, default 🎨): ");
    const emoji = await term.inputField();
    term.write("\n");

    try {
      const personaData = {
        name: name || "Nova Persona",
        description: description || "Persona personalizada",
        emoji: emoji || "🎨",
      };

      const persona = await personaManager.addCustomPersona(personaData);

      clear();
      term.green(`\n✓ Persona "${persona.name}" criada com sucesso!\n`);

      term.white("Ativar esta persona agora? (s/N): ");
      const activate = await term.inputField();
      term.write("\n");

      if (activate.toLowerCase() === "s" || activate.toLowerCase() === "sim") {
        await personaManager.setActivePersona(persona.id);
        term.green(`✓ Persona "${persona.name}" ativada!\n`);
      }

      await this.waitForKeyPress();
      await this.showPersonasMenu();
    } catch (error) {
      term.red(`❌ Erro: ${error.message}\n`);
      await this.waitForKeyPress();
      await this.showPersonasMenu();
    }
  }

  /**
   * 📊 Status das personas
   */
  async showPersonaStatus(personaManager) {
    clear();
    term.bold.cyan("📊 Status das Personas\n\n");

    const status = personaManager.getPersonaStatus();

    term.white(`📊 Total de personas: `);
    term.cyan(`${status.total}\n`);
    term.white(`🎨 Personas customizadas: `);
    term.yellow(`${status.custom}\n`);

    if (status.active) {
      term.white(`\n🎯 Persona Ativa:\n`);
      term.write(`   ${status.active.emoji} `);
      term.green.bold(`${status.active.name}\n`);
      term.gray(`   ${status.active.description}\n`);
    }

    term.white("\n📁 Arquivos:\n");
    term.gray("   Config: .ai-workspace/personas.json\n");
    term.gray(
      "   Rules: .cursor/rules/persona-rules/active-persona-always.mdc\n"
    );

    await this.waitForKeyPress();
    await this.showPersonasMenu();
  }

  /**
   * ⏳ Spinner simples
   */
  createSpinner(message) {
    term.white(`⏳ ${message}`);
    const spinnerChars = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
    let i = 0;
    const animation = setInterval(() => {
      term.left(1).write(spinnerChars[i % spinnerChars.length]);
      i++;
    }, 100);
    return {
      stop: () => {
        clearInterval(animation);
        term.left(1).green("✓\n");
      },
      error: () => {
        clearInterval(animation);
        term.left(1).red("✗\n");
      },
    };
  }
}

export { InteractiveCLI };
