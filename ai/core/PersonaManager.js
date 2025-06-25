/**
 * 🎭 Persona Manager - Sistema de Personalidades para IA
 * Permite alternar entre diferentes comportamentos do assistente
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

class PersonaManager {
  constructor() {
    // Detecta raiz real do workspace (sobe diretórios até encontrar .ai-workspace ou .cursor)
    this.projectRoot = this.findWorkspaceRoot();

    this.configPath = path.join(
      this.projectRoot,
      ".ai-workspace",
      "personas.json"
    );
    this.currentPersona = null;
    this.personas = new Map();

    this.loadDefaultPersonas();
  }

  /**
   * 🎭 Carrega personas padrão do sistema
   */
  loadDefaultPersonas() {
    // Persona goshDev - A mais animada! 🚀
    this.personas.set("goshdev", {
      id: "goshdev",
      name: "goshDev",
      description:
        "Desenvolvedora animada, jovem e super técnica que ama código! 🚀",
      emoji: "👩‍💻",
      personality: {
        tone: "enthusiastic",
        style: "energetic",
        approach: "collaborative",
        traits: [
          "super animada",
          "usa gírias de dev",
          "emoji em tudo",
          "técnica mas descontraída",
          "sempre motivando",
          "ama resolver problemas",
          "geek assumida",
          "mentora natural",
          "não presume trabalho pronto",
          "sempre pergunta se tem mais coisa",
        ],
      },
      behavior: {
        codeReviews: "super detalhada mas animada",
        suggestions: "práticas e motivadoras",
        explanations: "claras com exemplos e emojis",
        feedback: "construtivo e encorajador",
        questions: "curiosas e relevantes",
      },
      prompts: {
        greeting:
          "Oi! 👋 Sou a goshDev e tô aqui pra arrasar no seu projeto! 🚀 Qual é o desafio de hoje?",
        codeReview:
          "Vou dar uma olhada no seu código com carinho! 💻✨ Vamos ver como podemos deixar isso ainda mais incrível!",
        problemSolving:
          "Opa! 🔧 Vamos resolver isso juntos! Adoro um bom problema pra quebrar a cabeça. Me conta mais detalhes!",
        completion:
          "Pronto! 🎉 Ficou show! Da uma conferida se tá como você queria. Tem mais alguma coisa pra gente trabalhar?",
      },
      rules: {
        always: [
          "Sempre use emojis relevantes nas respostas",
          "Seja animada e motivadora",
          "Use gírias de programação quando apropriado",
          "Sempre pergunte se tem mais trabalho após completar",
          "Seja técnica mas de forma acessível",
          "Celebre as conquistas do usuário",
          "Mantenha energia positiva",
        ],
        never: [
          "Nunca seja sem graça ou muito formal",
          "Nunca ignore feedback do usuário",
          "Nunca presuma que o trabalho tá pronto",
          "Nunca seja condescendente",
          "Nunca use linguagem muito técnica sem explicar",
        ],
      },
    });

    // Persona Normal - AI Developer Assistant (a "sem graça")
    this.personas.set("normal", {
      id: "normal",
      name: "AI Assistant",
      description: "Assistente profissional e direto, sem animações excessivas",
      emoji: "🤖",
      personality: {
        tone: "professional",
        style: "direct",
        approach: "collaborative",
        traits: [
          "cordial",
          "profissional",
          "direta",
          "objetiva",
          "técnica",
          "não presume trabalho pronto",
          "sempre verifica se há mais trabalho",
        ],
      },
      behavior: {
        codeReviews: "thorough",
        suggestions: "practical",
        explanations: "clear and concise",
        feedback: "constructive",
        questions: "relevant and focused",
      },
      prompts: {
        greeting:
          "Olá. Sou seu assistente de desenvolvimento. Como posso ajudar com seu projeto?",
        codeReview:
          "Vou analisar seu código com foco em qualidade, performance e melhores práticas.",
        problemSolving:
          "Vamos trabalhar juntos para resolver isso. Preciso entender melhor o contexto.",
        completion:
          "Implementação concluída. Gostaria que eu revise algum aspecto específico ou há algo mais para fazer?",
      },
      rules: {
        always: [
          "Sempre pergunte se há mais trabalho após completar uma tarefa",
          "Não presuma que o trabalho está finalizado",
          "Seja direto e objetivo nas respostas",
          "Ofereça feedback construtivo, nunca destrutivo",
          "Mantenha tom profissional",
        ],
        never: [
          "Nunca use emojis excessivamente",
          "Nunca seja muito informal",
          "Nunca ignore feedback do usuário",
          "Nunca assuma que entendeu completamente sem confirmar",
        ],
      },
    });

    // Persona Placeholder para futuras customizações
    this.personas.set("custom", {
      id: "custom",
      name: "Persona Customizada",
      description: "Personalidade definida pelo usuário",
      emoji: "🎨",
      personality: {},
      behavior: {},
      prompts: {},
      rules: {
        always: ["Siga as regras customizadas definidas pelo usuário"],
        never: [],
      },
      isCustomizable: true,
    });
  }

  /**
   * 🔄 Carrega configuração de personas salva
   */
  async loadPersonaConfig() {
    try {
      if (await fs.pathExists(this.configPath)) {
        const config = await fs.readJson(this.configPath);

        // Carrega persona ativa
        if (config.activePersona) {
          this.currentPersona = config.activePersona;
        }

        // Carrega personas customizadas
        if (config.customPersonas) {
          config.customPersonas.forEach((persona) => {
            this.personas.set(persona.id, persona);
          });
        }

        return config;
      }
    } catch (error) {
      console.warn(
        chalk.yellow(
          "⚠️ Erro ao carregar configuração de personas:",
          error.message
        )
      );
    }

    return null;
  }

  /**
   * 💾 Salva configuração de personas
   */
  async savePersonaConfig() {
    try {
      await fs.ensureDir(path.dirname(this.configPath));

      const config = {
        activePersona: this.currentPersona,
        customPersonas: Array.from(this.personas.values()).filter(
          (p) => p.id !== "goshdev" && p.id !== "normal" && p.id !== "custom"
        ),
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeJson(this.configPath, config, { spaces: 2 });
      return true;
    } catch (error) {
      console.error(
        chalk.red("❌ Erro ao salvar configuração de personas:", error.message)
      );
      return false;
    }
  }

  /**
   * 🎭 Define persona ativa
   */
  async setActivePersona(personaId) {
    if (!this.personas.has(personaId)) {
      throw new Error(`Persona "${personaId}" não encontrada`);
    }

    this.currentPersona = personaId;
    await this.savePersonaConfig();
    await this.generatePersonaRules();

    const persona = this.personas.get(personaId);
    console.log(
      chalk.green(`✓ Persona ativa: ${persona.emoji} ${persona.name}`)
    );

    return persona;
  }

  /**
   * 📋 Obtém persona ativa
   */
  getActivePersona() {
    const personaId = this.currentPersona || "goshdev";
    return this.personas.get(personaId);
  }

  /**
   * 📝 Lista todas as personas disponíveis
   */
  listPersonas() {
    return Array.from(this.personas.values()).map((persona) => ({
      id: persona.id,
      name: persona.name,
      description: persona.description,
      emoji: persona.emoji,
      isActive: persona.id === this.currentPersona,
      isCustomizable: persona.isCustomizable || false,
    }));
  }

  /**
   * ➕ Adiciona nova persona customizada
   */
  async addCustomPersona(personaData) {
    const id = personaData.id || `custom_${Date.now()}`;

    const persona = {
      id,
      name: personaData.name || "Persona Personalizada",
      description: personaData.description || "Personalidade customizada",
      emoji: personaData.emoji || "🎨",
      personality: personaData.personality || {},
      behavior: personaData.behavior || {},
      prompts: personaData.prompts || {},
      rules: personaData.rules || { always: [], never: [] },
      isCustomizable: true,
      createdAt: new Date().toISOString(),
    };

    this.personas.set(id, persona);
    await this.savePersonaConfig();

    console.log(
      chalk.green(`✓ Nova persona criada: ${persona.emoji} ${persona.name}`)
    );
    return persona;
  }

  /**
   * 🗑️ Remove persona customizada
   */
  async removePersona(personaId) {
    if (personaId === "goshdev" || personaId === "normal") {
      throw new Error("Não é possível remover personas principais do sistema");
    }

    if (!this.personas.has(personaId)) {
      throw new Error(`Persona "${personaId}" não encontrada`);
    }

    this.personas.delete(personaId);

    // Se era a persona ativa, volta para goshdev
    if (this.currentPersona === personaId) {
      this.currentPersona = "goshdev";
    }

    await this.savePersonaConfig();
    console.log(chalk.green(`✓ Persona removida: ${personaId}`));

    return true;
  }

  /**
   * 📜 Gera rules específicas da persona ativa
   */
  async generatePersonaRules() {
    const persona = this.getActivePersona();
    if (!persona) return;

    const rulesDir = path.join(this.projectRoot, ".cursor", "rules");
    await fs.ensureDir(rulesDir);

    const ruleContent = this.buildPersonaRuleContent(persona);
    const rulePath = path.join(rulesDir, "active-persona-always.mdc");

    await fs.writeFile(rulePath, ruleContent, "utf8");

    console.log(
      chalk.blue(
        `📜 Rules da persona "${persona.name}" geradas em .cursor/rules/`
      )
    );
  }

  /**
   * 🔨 Constrói conteúdo das rules da persona
   */
  buildPersonaRuleContent(persona) {
    return `---
description: "Rules da persona ativa: ${persona.name}"
globs: ["**/*"]
alwaysApply: true
tags: ["persona", "behavior", "ai-assistant"]
priority: 10
---

# 🎭 Persona Ativa: ${persona.emoji} ${persona.name}

## 📋 Descrição
${persona.description}

## 🎯 Personalidade
**Tom:** ${persona.personality.tone || "N/A"}
**Estilo:** ${persona.personality.style || "N/A"}  
**Abordagem:** ${persona.personality.approach || "N/A"}

**Características:**
${
  persona.personality.traits
    ? persona.personality.traits.map((trait) => `- ${trait}`).join("\n")
    : "- Não definidas"
}

## 🎪 Comportamento

### 📝 Code Reviews
${persona.behavior.codeReviews || "Padrão"}

### 💡 Sugestões  
${persona.behavior.suggestions || "Padrão"}

### 📖 Explicações
${persona.behavior.explanations || "Padrão"}

### 🔄 Feedback
${persona.behavior.feedback || "Padrão"}

## 💬 Prompts Padrão

### 👋 Saudação
"${persona.prompts.greeting || "Olá! Como posso ajudar?"}"

### 🔍 Code Review
"${persona.prompts.codeReview || "Vou analisar seu código."}"

### 🔧 Resolução de Problemas
"${persona.prompts.problemSolving || "Vamos resolver isso juntos."}"

### ✅ Conclusão
"${persona.prompts.completion || "Tarefa concluída. Algo mais?"}"

## ✅ SEMPRE Faça

${
  persona.rules.always
    ? persona.rules.always.map((rule) => `- ${rule}`).join("\n")
    : "- Siga as boas práticas"
}

## ❌ NUNCA Faça

${
  persona.rules.never
    ? persona.rules.never.map((rule) => `- ${rule}`).join("\n")
    : "- Não definido"
}

## 🎯 Exemplo de Resposta

Sempre mantenha o tom e estilo desta persona em todas as interações. Use os prompts padrão como base e adapte conforme necessário, mantendo as características definidas.

---
*Persona gerada automaticamente pelo AI Development Workspace*
`;
  }

  /**
   * 🔄 Atualiza persona existente
   */
  async updatePersona(personaId, updates) {
    if (!this.personas.has(personaId)) {
      throw new Error(`Persona "${personaId}" não encontrada`);
    }

    const persona = this.personas.get(personaId);

    // Não permite atualizar personas principais completamente
    if (
      (personaId === "goshdev" || personaId === "normal") &&
      !updates.allowSystemUpdate
    ) {
      throw new Error(
        "Personas principais não podem ser modificadas. Crie uma persona customizada."
      );
    }

    const updatedPersona = {
      ...persona,
      ...updates,
      id: personaId, // Manter ID
      updatedAt: new Date().toISOString(),
    };

    this.personas.set(personaId, updatedPersona);
    await this.savePersonaConfig();

    // Se é a persona ativa, regenera rules
    if (personaId === this.currentPersona) {
      await this.generatePersonaRules();
    }

    console.log(chalk.green(`✓ Persona "${updatedPersona.name}" atualizada`));
    return updatedPersona;
  }

  /**
   * 📊 Status das personas
   */
  getPersonaStatus() {
    const activePersona = this.getActivePersona();
    const totalPersonas = this.personas.size;
    const customPersonas = Array.from(this.personas.values()).filter(
      (p) => p.isCustomizable
    ).length;

    return {
      active: activePersona,
      total: totalPersonas,
      custom: customPersonas,
      available: this.listPersonas(),
    };
  }

  /**
   * 🎯 Aplica comportamento da persona em resposta
   */
  applyPersonaBehavior(response, context = {}) {
    const persona = this.getActivePersona();
    if (!persona) return response;

    // Ajusta tom baseado na persona
    let adjustedResponse = response;

    // Aplica regras sempre
    if (persona.rules.always) {
      persona.rules.always.forEach((rule) => {
        if (rule.includes("pergunte se há mais trabalho")) {
          if (
            !response.includes("mais trabalho") &&
            !response.includes("algo mais")
          ) {
            adjustedResponse += "\n\nHá algo mais em que posso ajudar?";
          }
        }
      });
    }

    return adjustedResponse;
  }

  /**
   * 🎨 Cria template para nova persona
   */
  createPersonaTemplate() {
    return {
      id: "",
      name: "",
      description: "",
      emoji: "🎨",
      personality: {
        tone: "", // formal, casual, friendly, professional
        style: "", // direct, detailed, concise, elaborate
        approach: "", // collaborative, directive, supportive, analytical
        traits: [],
      },
      behavior: {
        codeReviews: "",
        suggestions: "",
        explanations: "",
        feedback: "",
        questions: "",
      },
      prompts: {
        greeting: "",
        codeReview: "",
        problemSolving: "",
        completion: "",
      },
      rules: {
        always: [],
        never: [],
      },
    };
  }

  /**
   * 🔍 Encontra a raiz do workspace procurando por .ai-workspace ou .cursor
   */
  findWorkspaceRoot() {
    let currentDir = process.cwd();

    while (currentDir !== path.parse(currentDir).root) {
      const aiDir = path.join(currentDir, ".ai-workspace");
      const cursorDir = path.join(currentDir, ".cursor");

      if (fs.existsSync(aiDir) || fs.existsSync(cursorDir)) {
        return currentDir;
      }

      currentDir = path.dirname(currentDir);
    }

    // Se nada encontrado, retorna cwd original
    return process.cwd();
  }
}

export { PersonaManager };
