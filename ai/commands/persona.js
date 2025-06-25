#!/usr/bin/env node

/**
 * 🎭 Comando Persona - Gerenciamento de personalidades do AI
 */

import { Command } from "commander";
import { PersonaManager } from "../core/PersonaManager.js";
import chalk from "chalk";
import inquirer from "inquirer";

class PersonaCommand {
  constructor(options = {}) {
    this.options = options;
    this.personaManager = new PersonaManager();
  }

  /**
   * 🎭 Executa comando de persona
   */
  async run() {
    try {
      await this.personaManager.loadPersonaConfig();

      const action = this.options.action || (await this.promptAction());

      switch (action) {
        case "list":
          await this.listPersonas();
          break;
        case "switch":
          await this.switchPersona();
          break;
        case "create":
          await this.createPersona();
          break;
        case "status":
          await this.showStatus();
          break;
        case "interactive":
          await this.interactiveMode();
          break;
        default:
          await this.showHelp();
      }
    } catch (error) {
      console.error(chalk.red("❌ Erro no comando persona:"), error.message);
      process.exit(1);
    }
  }

  /**
   * 🎯 Prompt para ação
   */
  async promptAction() {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "O que você gostaria de fazer?",
        choices: [
          { name: "📋 Listar personas disponíveis", value: "list" },
          { name: "🔄 Trocar persona ativa", value: "switch" },
          { name: "➕ Criar nova persona", value: "create" },
          { name: "📊 Ver status atual", value: "status" },
          { name: "🎪 Modo interativo", value: "interactive" },
        ],
      },
    ]);

    return action;
  }

  /**
   * 📋 Lista todas as personas
   */
  async listPersonas() {
    console.log(chalk.blue.bold("\n🎭 Personas Disponíveis\n"));

    const personas = this.personaManager.listPersonas();

    personas.forEach((persona) => {
      const activeIcon = persona.isActive ? chalk.green("●") : "○";
      const customIcon = persona.isCustomizable ? chalk.yellow("🎨") : "";

      console.log(
        `${activeIcon} ${persona.emoji} ${chalk.white.bold(
          persona.name
        )} ${customIcon}`
      );
      console.log(`   ${chalk.gray(persona.description)}`);
      if (persona.isActive) {
        console.log(`   ${chalk.green("✓ Ativa no momento")}`);
      }
      console.log("");
    });
  }

  /**
   * 🔄 Troca persona ativa
   */
  async switchPersona() {
    const personas = this.personaManager.listPersonas();

    if (personas.length === 0) {
      console.log(chalk.yellow("⚠️ Nenhuma persona disponível"));
      return;
    }

    const { personaId } = await inquirer.prompt([
      {
        type: "list",
        name: "personaId",
        message: "Escolha a persona:",
        choices: personas.map((p) => ({
          name: `${p.emoji} ${p.name} ${
            p.isActive ? chalk.green("(ativa)") : ""
          }`,
          value: p.id,
        })),
      },
    ]);

    const persona = await this.personaManager.setActivePersona(personaId);

    console.log(
      chalk.green(
        `\n✓ Persona ativa alterada para: ${persona.emoji} ${persona.name}`
      )
    );
    console.log(
      chalk.gray(
        "📜 Rules geradas automaticamente em .cursor/rules/persona-rules/"
      )
    );
    console.log(chalk.blue("🔄 Reinicie o Cursor para aplicar as mudanças"));
  }

  /**
   * ➕ Cria nova persona
   */
  async createPersona() {
    console.log(chalk.blue.bold("\n➕ Criando Nova Persona\n"));

    // Informações básicas
    const basic = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Nome da persona:",
        validate: (input) => input.length > 0 || "Nome é obrigatório",
      },
      {
        type: "input",
        name: "description",
        message: "Descrição:",
      },
      {
        type: "input",
        name: "emoji",
        message: "Emoji (opcional):",
        default: "🎨",
      },
    ]);

    const persona = await this.personaManager.addCustomPersona(basic);

    console.log(
      chalk.green(`\n✓ Persona "${persona.name}" criada com sucesso!`)
    );

    // Pergunta se quer ativar
    const { activate } = await inquirer.prompt([
      {
        type: "confirm",
        name: "activate",
        message: "Ativar esta persona agora?",
        default: true,
      },
    ]);

    if (activate) {
      await this.personaManager.setActivePersona(persona.id);
      console.log(chalk.green(`✓ Persona "${persona.name}" ativada!`));
    }
  }

  /**
   * 📊 Mostra status atual
   */
  async showStatus() {
    const status = this.personaManager.getPersonaStatus();

    console.log(chalk.blue.bold("\n🎭 Status das Personas\n"));

    console.log(`📊 Total de personas: ${chalk.cyan(status.total)}`);
    console.log(`🎨 Personas customizadas: ${chalk.yellow(status.custom)}`);

    if (status.active) {
      console.log(`\n🎯 Persona Ativa:`);
      console.log(
        `   ${status.active.emoji} ${chalk.green.bold(status.active.name)}`
      );
      console.log(`   ${chalk.gray(status.active.description)}`);
    }

    console.log("\n📁 Arquivos:");
    console.log(`   Config: ${chalk.gray(".ai-workspace/personas.json")}`);
    console.log(
      `   Rules: ${chalk.gray(
        ".cursor/rules/persona-rules/active-persona-always.mdc"
      )}`
    );
  }

  /**
   * 🎪 Modo interativo
   */
  async interactiveMode() {
    console.log(chalk.blue.bold("\n🎪 Modo Interativo de Personas\n"));

    let continueMenu = true;

    while (continueMenu) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "O que fazer?",
          choices: [
            { name: "📋 Ver personas", value: "list" },
            { name: "🔄 Trocar persona", value: "switch" },
            { name: "➕ Criar persona", value: "create" },
            { name: "📊 Ver status", value: "status" },
            { name: "🚪 Sair", value: "exit" },
          ],
        },
      ]);

      if (action === "exit") {
        continueMenu = false;
        console.log(chalk.green("\n✨ Até logo!"));
      } else {
        switch (action) {
          case "list":
            await this.listPersonas();
            break;
          case "switch":
            await this.switchPersona();
            break;
          case "create":
            await this.createPersona();
            break;
          case "status":
            await this.showStatus();
            break;
        }

        if (continueMenu) {
          await inquirer.prompt([
            {
              type: "input",
              name: "continue",
              message: "Pressione Enter para continuar...",
            },
          ]);
        }
      }
    }
  }

  /**
   * ❓ Mostra ajuda
   */
  async showHelp() {
    console.log(chalk.blue.bold("\n🎭 Comando Persona - Ajuda\n"));

    console.log(chalk.white("Uso:"));
    console.log("  ai-workspace persona [ação]\n");

    console.log(chalk.white("Ações disponíveis:"));
    console.log("  list       📋 Lista personas disponíveis");
    console.log("  switch     🔄 Troca persona ativa");
    console.log("  create     ➕ Cria nova persona customizada");
    console.log("  status     📊 Mostra status atual");
    console.log("  interactive 🎪 Modo interativo");

    console.log(chalk.white("\nExemplos:"));
    console.log("  ai-workspace persona list");
    console.log("  ai-workspace persona switch");
    console.log("  ai-workspace persona create");
  }
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = new PersonaCommand();
  command.run();
}

export { PersonaCommand };
