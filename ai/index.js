/**
 * 🤖 AI Development Workspace - Main Entry Point
 * Framework genérico para automação inteligente em projetos Node.js
 *
 * @version 1.0.0
 * @author AI Dev Workspace Team
 * @license MIT
 */

// Core components
export { ProjectDetector } from "./core/ProjectDetector.js";
export { HealthAnalyzer } from "./core/HealthAnalyzer.js";
export { VisualAnalyzer } from "./core/VisualAnalyzer.js";
export { ReportGenerator } from "./core/ReportGenerator.js";
export { Setup } from "./core/Setup.js";
export { CursorSetup } from "./core/CursorSetup.js";

// Commands
export { HealthCheckCommand } from "./commands/health-check.js";
export { VisualAuditCommand } from "./commands/visual-audit.js";

// Configuration
export { default as config } from "./ai.config.js";

/**
 * 🚀 Main AIWorkspace class - Facade for all operations
 */
export class AIWorkspace {
  constructor(options = {}) {
    this.options = {
      projectRoot: process.cwd(),
      interactive: true,
      ...options,
    };

    this.detection = null;
  }

  /**
   * 🔍 Detect project type and configuration
   */
  async detect() {
    if (!this.detection) {
      const detector = new ProjectDetector(this.options.projectRoot);
      this.detection = await detector.detect();
    }
    return this.detection;
  }

  /**
   * 🚀 Setup complete workspace
   */
  async setup(options = {}) {
    const setup = new Setup({
      ...this.options,
      ...options,
    });

    return await setup.run();
  }

  /**
   * 🏥 Run health check analysis
   */
  async healthCheck() {
    const detection = await this.detect();
    const analyzer = new HealthAnalyzer(detection);
    const healthData = await analyzer.analyze();

    return {
      detection,
      health: healthData,
      score: healthData.overallScore,
    };
  }

  /**
   * 👁️ Run visual audit
   */
  async visualAudit() {
    const detection = await this.detect();

    if (detection.activePorts.length === 0) {
      throw new Error(
        "No active server detected. Please start your development server."
      );
    }

    const analyzer = new VisualAnalyzer({
      detection,
      outputDir: this.options.outputDir || "outputs",
    });

    const visualData = await analyzer.analyze();

    return {
      detection,
      visual: visualData,
    };
  }

  /**
   * 📋 Generate report
   */
  async generateReport(type, data) {
    const generator = new ReportGenerator({
      type,
      detection: this.detection,
      data,
      outputDir: this.options.outputDir || "outputs",
    });

    return await generator.generate();
  }

  /**
   * 📊 Get workspace status
   */
  async getStatus() {
    try {
      const detection = await this.detect();

      return {
        configured: true,
        project: {
          type: detection.type,
          subtype: detection.subtype,
          confidence: detection.confidence,
        },
        features: detection.features,
        activePorts: detection.activePorts,
        suggestions: detection.suggestions,
      };
    } catch (error) {
      return {
        configured: false,
        error: error.message,
      };
    }
  }

  /**
   * 🎯 Quick start - setup and initial analysis
   */
  async quickStart() {
    console.log("🤖 AI Workspace Quick Start...");

    // 1. Setup if not configured
    const status = await this.getStatus();
    if (!status.configured) {
      await this.setup();
    }

    // 2. Run health check
    const health = await this.healthCheck();

    // 3. Run visual audit if server is active
    let visual = null;
    if (health.detection.activePorts.length > 0) {
      try {
        visual = await this.visualAudit();
      } catch (error) {
        console.warn("Visual audit skipped:", error.message);
      }
    }

    return {
      health,
      visual,
      recommendations: this.generateRecommendations(health, visual),
    };
  }

  /**
   * 💡 Generate smart recommendations
   */
  generateRecommendations(health, visual) {
    const recommendations = [];

    if (health.health.overallScore < 60) {
      recommendations.push({
        priority: "high",
        type: "health",
        message: "Critical issues detected. Run health check for details.",
        action: "ai-workspace health-check",
      });
    }

    if (health.health.testing.score < 50) {
      recommendations.push({
        priority: "medium",
        type: "testing",
        message: "Low test coverage detected. Consider generating tests.",
        action: "ai-workspace test-generate",
      });
    }

    if (visual && visual.visual.issues.length > 3) {
      recommendations.push({
        priority: "medium",
        type: "visual",
        message: "Multiple visual issues detected. Review UI components.",
        action: "Check visual audit report",
      });
    }

    if (health.health.security.vulnerabilities.length > 0) {
      recommendations.push({
        priority: "high",
        type: "security",
        message: "Security vulnerabilities found.",
        action: "npm audit fix",
      });
    }

    return recommendations;
  }
}

/**
 * 🎯 Quick helper functions for common operations
 */

/**
 * Detect project type quickly
 */
export async function detectProject(projectRoot = process.cwd()) {
  const detector = new ProjectDetector(projectRoot);
  return await detector.detect();
}

/**
 * Quick health check
 */
export async function quickHealthCheck(projectRoot = process.cwd()) {
  const workspace = new AIWorkspace({ projectRoot });
  return await workspace.healthCheck();
}

/**
 * Quick visual audit
 */
export async function quickVisualAudit(projectRoot = process.cwd()) {
  const workspace = new AIWorkspace({ projectRoot });
  return await workspace.visualAudit();
}

/**
 * Quick setup
 */
export async function quickSetup(options = {}) {
  const workspace = new AIWorkspace(options);
  return await workspace.setup();
}

// Default export for convenience
export default AIWorkspace;

/**
 * Framework information
 */
export const version = config.version;
export const name = config.name;

/**
 * Example usage patterns
 */
export const examples = {
  // Programmatic usage
  api: `
import { AIWorkspace } from '@ai-dev-workspace/core';

const workspace = new AIWorkspace();
const health = await workspace.healthCheck();
console.log('Health score:', health.score);
`,

  // CLI usage
  cli: `
# Setup workspace
ai-workspace setup

# Health check
ai-workspace health-check

# Visual audit
ai-workspace visual-audit
`,

  // Quick functions
  quick: `
import { quickHealthCheck, quickSetup } from '@ai-dev-workspace/core';

// Quick setup
await quickSetup();

// Quick health check
const { score } = await quickHealthCheck();
console.log('Health score:', score);
`,
};

// Version info for debugging
console.log(`🤖 AI Workspace v${version} loaded`);
