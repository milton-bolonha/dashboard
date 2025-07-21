// MCP Provider - Conceitos do Livro "Padrões de Desenvolvimento Moderno"
// Este provider injeta contexto específico baseado no tipo de arquivo sendo editado

export default defineContext((ctx) => {
  const { filePath, language, fileContent } = ctx;

  // Contexto base sempre incluído
  const baseContext = {
    files: [".cursor/prompt_rules/milton-voice.mdc"],
    rules: [
      "Sempre usar linguagem conversacional do Milton",
      "Priorizar conceitos sobre código",
    ],
  };

  // Context para arquivos JavaScript/TypeScript
  if (
    language === "javascript" ||
    language === "typescript" ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".ts")
  ) {
    return {
      ...baseContext,
      files: [
        ".cursor/prompt_rules/code-clarity.mdc",
        ".cursor/prompt_rules/teias-framework.mdc",
        ".cursor/context/architecture.mdc",
      ],
      rules: [
        "Aplicar TE[i]As quando analisar arquitetura",
        "Manter complexidade cognitiva abaixo de 10 pontos por função",
        "Usar Smart/Dumb pattern para componentes React",
        "Extrair condições complexas em funções nomeadas",
        "Comentários em português quando necessário",
      ],
    };
  }

  // Context para arquivos React (JSX/TSX)
  if (filePath.endsWith(".jsx") || filePath.endsWith(".tsx")) {
    return {
      ...baseContext,
      files: [
        ".cursor/prompt_rules/code-clarity.mdc",
        ".cursor/context/architecture.mdc",
      ],
      rules: [
        "Aplicar Smart/Dumb Component pattern rigorosamente",
        "Smart components: lógica e estado apenas",
        "Dumb components: visual e props apenas",
        "Usar nomes de props em português quando didático",
        "Priorizar clareza na hierarquia de componentes",
      ],
    };
  }

  // Context para package.json e configurações npm
  if (filePath.includes("package.json")) {
    return {
      ...baseContext,
      files: [".cursor/prompt_rules/workspace-patterns.mdc"],
      rules: [
        "Usar padrão 'workspace:ação' para scripts",
        "Organizar dependencies: root para compartilhadas, workspace para específicas",
        "Manter 'private: true' e 'type: module' no root",
        "Scripts descritivos e consistentes entre workspaces",
      ],
    };
  }

  // Context para arquivos de pipeline/fluxo
  if (
    fileContent?.includes("pipeline") ||
    fileContent?.includes("deck") ||
    fileContent?.includes("card") ||
    filePath.includes("deckEngine")
  ) {
    return {
      ...baseContext,
      files: [".cursor/prompt_rules/cards-pipeline.mdc"],
      rules: [
        "Usar metáfora Cards/Decks para explicar pipelines",
        "Card = unidade mínima de processamento",
        "Deck = sequência ordenada para uma missão",
        "Partida = execução do pipeline",
        "Aplicar padrões CRUD, Saga ou Pipeline conforme necessário",
      ],
    };
  }

  // Context para arquivos de debugging/logs
  if (
    fileContent?.includes("console.log") ||
    fileContent?.includes("error") ||
    fileContent?.includes("debug") ||
    filePath.includes("log")
  ) {
    return {
      ...baseContext,
      files: [".cursor/context/debugging-method.mdc"],
      rules: [
        "Usar metodologia de investigação sistemática",
        "Logs estruturados com contexto completo",
        "Aplicar os 5 passos: Evidências → Hipóteses → Testes → Solução → Validação",
        "Comentários explicando o 'porquê', não o 'como'",
      ],
    };
  }

  // Context para arquivos de documentação
  if (filePath.endsWith(".md") || filePath.endsWith(".mdx")) {
    return {
      ...baseContext,
      files: [".cursor/prompt_rules/milton-voice.mdc", "livro/00-sumario.md"],
      rules: [
        "Usar tom conversacional 'falado conversado'",
        "Estrutura: Problema → Conceito → Exemplo → Benefício",
        "Metáforas visuais para conceitos técnicos",
        "Progressão natural do simples ao complexo",
        "Incluir referências ao livro quando relevante",
      ],
    };
  }

  // Context para configurações (YAML, JSON, TOML)
  if (
    filePath.endsWith(".yml") ||
    filePath.endsWith(".yaml") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".toml")
  ) {
    return {
      ...baseContext,
      files: [".cursor/context/architecture.mdc"],
      rules: [
        "Configurações hierárquicas e organizadas",
        "Comentários explicativos quando necessário",
        "Ambientes diferentes com configs específicas",
        "Validação de configurações quando possível",
      ],
    };
  }

  // Context para arquivos de API/backend
  if (
    filePath.includes("/api/") ||
    filePath.includes("server") ||
    fileContent?.includes("Request") ||
    fileContent?.includes("Response")
  ) {
    return {
      ...baseContext,
      files: [
        ".cursor/context/architecture.mdc",
        ".cursor/prompt_rules/code-clarity.mdc",
      ],
      rules: [
        "APIs seguem padrão DashMaster.PRO",
        "Validação de entrada sempre",
        "Logs estruturados para debugging",
        "Tratamento de erro robusto",
        "Documentação clara dos endpoints",
      ],
    };
  }

  // Context para testes
  if (
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.includes("__tests__")
  ) {
    return {
      ...baseContext,
      files: [".cursor/prompt_rules/code-clarity.mdc"],
      rules: [
        "Testes descritivos em português",
        "Cenários: sucesso, falha, edge cases",
        "Setup e cleanup claros",
        "Assertions específicas e explicativas",
        "Teste uma responsabilidade por vez",
      ],
    };
  }

  // Context para arquivos de estilo (CSS, SCSS)
  if (
    language === "css" ||
    filePath.endsWith(".css") ||
    filePath.endsWith(".scss") ||
    filePath.endsWith(".sass")
  ) {
    return {
      ...baseContext,
      rules: [
        "Nomes de classes em português quando didático",
        "Organização hierárquica clara",
        "Responsividade mobile-first",
        "Variáveis para cores e medidas",
        "Comentários para seções complexas",
      ],
    };
  }

  // Context para arquivos de ambiente (.env)
  if (filePath.includes(".env")) {
    return {
      ...baseContext,
      files: [".cursor/context/architecture.mdc"],
      rules: [
        "Organização hierárquica por workspace",
        "Comentários explicativos para cada variável",
        "Valores de exemplo para desenvolvimento",
        "Nunca commitar valores reais de produção",
        "Agrupamento por funcionalidade",
      ],
    };
  }

  // Context padrão quando nenhuma regra específica se aplica
  return {
    ...baseContext,
    files: [".cursor/prompt_rules/teias-framework.mdc"],
    rules: [
      "Aplicar framework TE[i]As quando analisar sistemas",
      "Linguagem clara e acessível",
      "Conceitos antes de implementação",
    ],
  };
});

// Função auxiliar para detectar tipo de contexto baseado no conteúdo
function detectContextType(filePath: string, content: string): string {
  // Pipeline/Workflow context
  if (
    content.includes("pipeline") ||
    content.includes("deck") ||
    content.includes("workflow")
  ) {
    return "pipeline";
  }

  // Architecture context
  if (
    content.includes("component") ||
    content.includes("service") ||
    content.includes("module")
  ) {
    return "architecture";
  }

  // Debugging context
  if (
    content.includes("error") ||
    content.includes("debug") ||
    content.includes("console.log")
  ) {
    return "debugging";
  }

  // Business logic context
  if (
    content.includes("user") ||
    content.includes("order") ||
    content.includes("payment")
  ) {
    return "business";
  }

  return "general";
}

// Metadados do provider
export const metadata = {
  name: "Milton's Book Concepts",
  description:
    "Contexto dinâmico baseado nos padrões do livro 'Padrões de Desenvolvimento Moderno'",
  author: "Milton Bolonha",
  version: "1.0.0",
  concepts: [
    "TE[i]As Framework",
    "Cards/Decks Pipeline Metaphor",
    "Smart/Dumb Components",
    "Cognitive Complexity",
    "Document-First Methodology",
    "Workspace Patterns",
    "Systematic Debugging",
  ],
};
