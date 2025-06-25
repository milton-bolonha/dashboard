/**
 * 📋 Report Generator - Geração inteligente de relatórios
 * Cria relatórios em Markdown com insights e visualizações
 */

import fs from "fs-extra";
import path from "path";
import config from "../ai.config.js";

export class ReportGenerator {
  constructor(options) {
    this.options = {
      type: "generic",
      outputDir: config.outputs.baseDir,
      format: "markdown",
      ...options,
    };

    this.timestamp = new Date().toISOString();
    this.dateFolder = config.outputs.dateOrganized
      ? this.timestamp.slice(0, 7) // YYYY-MM
      : "";
  }

  /**
   * 🎯 Gera relatório baseado no tipo
   */
  async generate() {
    const generators = {
      "health-check": this.generateHealthReport.bind(this),
      "visual-audit": this.generateVisualReport.bind(this),
      "test-generation": this.generateTestReport.bind(this),
      performance: this.generatePerformanceReport.bind(this),
      security: this.generateSecurityReport.bind(this),
    };

    const generator =
      generators[this.options.type] || this.generateGenericReport.bind(this);
    return await generator();
  }

  /**
   * 🏥 Gera relatório de health check
   */
  async generateHealthReport() {
    const { detection, data } = this.options;
    const filename = `health-check-${this.timestamp.replace(/[:.]/g, "-")}.md`;
    const filepath = await this.getOutputPath("reports", filename);

    const content = this.buildHealthReportContent(detection, data);

    await fs.writeFile(filepath, content);

    return {
      type: "health-check",
      filename,
      filePath: filepath,
      timestamp: this.timestamp,
      summary: this.extractSummary(data),
    };
  }

  /**
   * 🏥 Constrói conteúdo do relatório de saúde
   */
  buildHealthReportContent(detection, data) {
    const score = data.overallScore;
    const emoji = score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌";

    return `# 🏥 Health Check Report

**Projeto:** ${detection.type}${
      detection.subtype ? ` (${detection.subtype})` : ""
    }  
**Gerado em:** ${new Date(this.timestamp).toLocaleString("pt-BR")}  
**Score Geral:** ${emoji} **${score}/100**

---

## 📊 Resumo Executivo

${this.generateExecutiveSummary(data)}

---

## 📈 Análise por Categoria

${this.generateCategoryAnalysis(data)}

---

## 🚨 Issues Críticos

${this.generateCriticalIssues(data)}

---

## ⚠️ Avisos e Recomendações

${this.generateWarningsAndRecommendations(data)}

---

## 🎯 Plano de Ação

${this.generateActionPlan(data)}

---

## 📋 Detalhes Técnicos

${this.generateTechnicalDetails(detection, data)}

---

## 🔄 Próximos Health Checks

- **Recomendado:** ${this.getNextCheckRecommendation(score)}
- **Comando:** \`npm run ai:health-check\`

---

_Relatório gerado automaticamente pelo AI Workspace v${config.version}_
`;
  }

  /**
   * 📊 Gera resumo executivo
   */
  generateExecutiveSummary(data) {
    const score = data.overallScore;

    if (score >= 80) {
      return `🎉 **Excelente!** Seu projeto está em ótima saúde. O score de ${score}/100 indica que as práticas de desenvolvimento estão bem implementadas. Continue mantendo os padrões de qualidade e considere implementar monitoramento contínuo.`;
    } else if (score >= 60) {
      return `👍 **Bom!** Seu projeto tem uma base sólida com score ${score}/100, mas há oportunidades de melhoria. Foque nos avisos apresentados para elevar a qualidade geral.`;
    } else {
      return `🚨 **Atenção Necessária!** O score ${score}/100 indica que há issues importantes que precisam ser resolvidos. Priorize as correções críticas listadas abaixo.`;
    }
  }

  /**
   * 📈 Gera análise por categoria
   */
  generateCategoryAnalysis(data) {
    const categories = [
      { name: "Dependencies", key: "dependencies", icon: "📦" },
      { name: "Security", key: "security", icon: "🔒" },
      { name: "Performance", key: "performance", icon: "⚡" },
      { name: "Code Quality", key: "quality", icon: "✨" },
      { name: "Testing", key: "testing", icon: "🧪" },
    ];

    return categories
      .map((cat) => {
        const categoryData = data[cat.key];
        const score = categoryData.score;
        const status =
          score >= 80
            ? "✅ Excelente"
            : score >= 60
            ? "⚠️ Atenção"
            : "❌ Crítico";

        return `### ${cat.icon} ${cat.name} - ${score}/100 ${status}

${
  categoryData.issues.length > 0
    ? `**Issues:**\n${categoryData.issues
        .map((issue) => `- ${issue}`)
        .join("\n")}`
    : "✅ Nenhum issue encontrado"
}

${this.generateCategoryDetails(cat.key, categoryData)}
`;
      })
      .join("\n");
  }

  /**
   * 🔍 Gera detalhes específicos por categoria
   */
  generateCategoryDetails(category, data) {
    switch (category) {
      case "dependencies":
        return `**Estatísticas:**
- Total de dependências: ${data.total}
- Desatualizadas: ${data.outdated.length}
- Vulneráveis: ${data.vulnerable.length}
${
  data.missingTypes.length > 0
    ? `- Sem tipos TS: ${data.missingTypes.length}`
    : ""
}`;

      case "security":
        return `**Vulnerabilidades:**
${
  data.vulnerabilities.length > 0
    ? data.vulnerabilities
        .map((v) => `- ${v.name}: ${v.severity}`)
        .slice(0, 5)
        .join("\n")
    : "✅ Nenhuma vulnerabilidade conhecida"
}`;

      case "performance":
        return `**Métricas:**
${data.bundleSize ? `- Bundle size: ${data.bundleSize}` : ""}
${data.serverResponse ? `- Tempo de resposta: ${data.serverResponse}` : ""}
${data.issues.length > 0 ? `- Issues: ${data.issues.join(", ")}` : ""}`;

      case "quality":
        return `**Ferramentas:**
- ESLint: ${data.linting ? "✅" : "❌"}
- Prettier: ${data.formatting ? "✅" : "❌"}
- TypeScript: ${data.typeChecking ? "✅" : "❌"}
- Pre-commit hooks: ${data.preCommitHooks ? "✅" : "❌"}`;

      case "testing":
        return `**Cobertura:**
- Framework: ${data.framework || "Não configurado"}
- Arquivos de teste: ${data.testFiles}
- E2E tests: ${data.e2eTests ? "✅" : "❌"}
- Coverage estimado: ~${data.coverage}%`;

      default:
        return "";
    }
  }

  /**
   * 🚨 Gera seção de issues críticos
   */
  generateCriticalIssues(data) {
    if (data.criticalIssues.length === 0) {
      return "✅ **Nenhum issue crítico encontrado!** Seu projeto está bem estruturado.";
    }

    return `${data.criticalIssues
      .map((issue, index) => `${index + 1}. **${issue}**`)
      .join("\n\n")}

> 💡 **Dica:** Resolva estes issues primeiro, pois têm impacto significativo na qualidade do projeto.`;
  }

  /**
   * ⚠️ Gera avisos e recomendações
   */
  generateWarningsAndRecommendations(data) {
    const content = [];

    if (data.warnings.length > 0) {
      content.push("### ⚠️ Avisos\n");
      content.push(data.warnings.map((warning) => `- ${warning}`).join("\n"));
    }

    if (data.suggestions.length > 0) {
      content.push("\n### 💡 Sugestões\n");
      content.push(
        data.suggestions.map((suggestion) => `- ${suggestion}`).join("\n")
      );
    }

    return content.join("\n") || "✅ Nenhum aviso ou sugestão no momento.";
  }

  /**
   * 🎯 Gera plano de ação
   */
  generateActionPlan(data) {
    const actions = [];
    const score = data.overallScore;

    if (score < 60) {
      actions.push("## 🚨 Ações Urgentes (Próximos 1-2 dias)");
      actions.push("1. `npm audit fix` - Corrigir vulnerabilidades");
      actions.push("2. `npm run ai:security` - Análise detalhada de segurança");
      actions.push(
        "3. Configurar testes básicos com `npm run ai:test-generate`"
      );
    } else if (score < 80) {
      actions.push("## 🎯 Melhorias Prioritárias (Próxima semana)");
      actions.push(
        "1. `npm run ai:test-generate` - Melhorar cobertura de testes"
      );
      actions.push("2. Configurar ESLint e Prettier se ainda não tiver");
      actions.push("3. `npm update` - Atualizar dependências");
    } else {
      actions.push("## 🚀 Otimizações Avançadas (Próximo sprint)");
      actions.push("1. `npm run ai:performance` - Análise de performance");
      actions.push("2. Configurar CI/CD se ainda não tiver");
      actions.push("3. Implementar monitoramento de produção");
    }

    actions.push("\n## 📅 Comandos Recomendados");

    // Comandos específicos baseados nos issues
    if (data.dependencies.outdated.length > 0) {
      actions.push("- `npm update` - Atualizar dependências");
    }
    if (data.testing.testFiles < 5) {
      actions.push("- `npm run ai:test-generate` - Gerar mais testes");
    }
    if (data.security.vulnerabilities.length > 0) {
      actions.push("- `npm audit fix` - Corrigir vulnerabilidades");
    }

    return actions.join("\n");
  }

  /**
   * 📋 Gera detalhes técnicos
   */
  generateTechnicalDetails(detection, data) {
    return `### 🔍 Informações do Projeto

- **Tipo:** ${detection.type}${
      detection.subtype ? ` (${detection.subtype})` : ""
    }
- **Confiança na detecção:** ${detection.confidence}%
- **Portas ativas:** ${
      detection.activePorts.length > 0
        ? detection.activePorts.join(", ")
        : "Nenhuma"
    }
- **TypeScript:** ${detection.features.typescript ? "Sim" : "Não"}
- **Frameworks de teste:** ${detection.features.testing.join(", ") || "Nenhum"}

### 📦 Stack Principal

${detection.stack
  .slice(0, 10)
  .map((dep) => `- ${dep}`)
  .join("\n")}

### 📊 Métricas Detalhadas

\`\`\`json
{
  "timestamp": "${data.timestamp}",
  "overallScore": ${data.overallScore},
  "categories": {
    "dependencies": ${data.dependencies.score},
    "security": ${data.security.score},
    "performance": ${data.performance.score},
    "quality": ${data.quality.score},
    "testing": ${data.testing.score}
  }
}
\`\`\``;
  }

  /**
   * 🔄 Determina quando fazer próximo check
   */
  getNextCheckRecommendation(score) {
    if (score < 60) return "Diário (até resolver issues críticos)";
    if (score < 80) return "Semanal (até melhorar qualidade)";
    return "Quinzenal (manutenção)";
  }

  /**
   * 📊 Extrai resumo do relatório
   */
  extractSummary(data) {
    return {
      score: data.overallScore,
      criticalIssues: data.criticalIssues.length,
      warnings: data.warnings.length,
      categories: {
        dependencies: data.dependencies.score,
        security: data.security.score,
        performance: data.performance.score,
        quality: data.quality.score,
        testing: data.testing.score,
      },
    };
  }

  /**
   * 👁️ Gera relatório de auditoria visual
   */
  async generateVisualReport() {
    const { data } = this.options;
    const filename = `visual-audit-${this.timestamp.replace(/[:.]/g, "-")}.md`;
    const filepath = await this.getOutputPath("reports", filename);

    const content = `# 👁️ Visual Audit Report

**Gerado em:** ${new Date(this.timestamp).toLocaleString("pt-BR")}  
**URL:** ${data.url}  
**Components detectados:** ${data.components.length}

---

## 📊 Resumo da Análise

${data.summary}

---

## 🧩 Componentes Detectados

${data.components
  .map(
    (comp, index) =>
      `### ${index + 1}. ${comp.type.toUpperCase()} - \`${comp.id}\`
  
- **Classes:** ${comp.classes || "Nenhuma"}
- **Visível:** ${comp.visible ? "Sim" : "Não"}
- **Texto:** "${comp.text?.substring(0, 100) || "N/A"}..."
`
  )
  .join("\n")}

---

## 📸 Screenshots Capturados

${data.screenshots
  .map((screenshot) => `- ${screenshot.filename} (${screenshot.timestamp})`)
  .join("\n")}

---

## 💡 Sugestões de Testes

${data.testSuggestions
  .map(
    (suggestion) =>
      `### ${suggestion.type}
${suggestion.description}

\`\`\`javascript
${suggestion.code}
\`\`\`
`
  )
  .join("\n")}

---

_Relatório gerado automaticamente pelo AI Workspace v${config.version}_
`;

    await fs.writeFile(filepath, content);

    return {
      type: "visual-audit",
      filename,
      filePath: filepath,
      timestamp: this.timestamp,
    };
  }

  /**
   * 🧪 Gera relatório de geração de testes
   */
  async generateTestReport() {
    const { data } = this.options;
    const filename = `test-generation-${this.timestamp.replace(
      /[:.]/g,
      "-"
    )}.md`;
    const filepath = await this.getOutputPath("reports", filename);

    const content = `# 🧪 Test Generation Report

**Gerado em:** ${new Date(this.timestamp).toLocaleString("pt-BR")}  
**Testes gerados:** ${data.testsGenerated}  
**Framework:** ${data.framework}

---

## 📋 Resumo

${data.summary}

---

## 📁 Arquivos Criados

${data.files.map((file) => `- ${file.path} (${file.type})`).join("\n")}

---

## 🎯 Cobertura Estimada

- **Antes:** ${data.coverageBefore}%
- **Depois:** ${data.coverageAfter}%
- **Melhoria:** +${data.coverageAfter - data.coverageBefore}%

---

## 🚀 Próximos Passos

${data.nextSteps.map((step) => `- ${step}`).join("\n")}

---

_Relatório gerado automaticamente pelo AI Workspace v${config.version}_
`;

    await fs.writeFile(filepath, content);

    return {
      type: "test-generation",
      filename,
      filePath: filepath,
      timestamp: this.timestamp,
    };
  }

  /**
   * 📁 Obtém caminho de output com organização por data
   */
  async getOutputPath(subdir, filename) {
    const outputDir = path.join(this.options.outputDir, subdir);
    const finalDir = this.dateFolder
      ? path.join(outputDir, this.dateFolder)
      : outputDir;

    await fs.ensureDir(finalDir);
    return path.join(finalDir, filename);
  }

  /**
   * 🔧 Gera relatório genérico
   */
  async generateGenericReport() {
    const { data } = this.options;
    const filename = `${this.options.type}-${this.timestamp.replace(
      /[:.]/g,
      "-"
    )}.md`;
    const filepath = await this.getOutputPath("reports", filename);

    const content = `# 📋 ${this.options.type.toUpperCase()} Report

**Gerado em:** ${new Date(this.timestamp).toLocaleString("pt-BR")}

---

## 📊 Dados

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

---

_Relatório gerado automaticamente pelo AI Workspace v${config.version}_
`;

    await fs.writeFile(filepath, content);

    return {
      type: this.options.type,
      filename,
      filePath: filepath,
      timestamp: this.timestamp,
    };
  }
}

export default ReportGenerator;
