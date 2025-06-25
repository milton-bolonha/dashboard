/**
 * 👁️ Visual Analyzer - Análise visual inteligente de interfaces
 * Usa Puppeteer para capturar e analisar componentes de UI
 */

import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import config from "../ai.config.js";

export class VisualAnalyzer {
  constructor(options) {
    this.options = options;
    this.detection = options.detection;
    this.outputDir = options.outputDir;
    this.browser = null;
    this.page = null;

    // Configurar diretórios de output
    this.setupOutputDirs();
  }

  /**
   * 📁 Configura diretórios de output
   */
  setupOutputDirs() {
    const now = new Date();
    const monthFolder = config.outputs.dateOrganized
      ? now.toISOString().slice(0, 7)
      : "";

    this.screenshotDir = monthFolder
      ? path.join(this.outputDir, "screenshots", monthFolder)
      : path.join(this.outputDir, "screenshots");

    this.artifactsDir = path.join(this.outputDir, "artifacts");
  }

  /**
   * 🎯 Análise principal
   */
  async analyze() {
    try {
      // 1. Inicializar browser
      await this.initializeBrowser();

      // 2. Detectar URL ativa
      const url = await this.detectActiveUrl();

      // 3. Navegar e carregar página
      const pageData = await this.loadPage(url);

      // 4. Analisar estrutura da página
      const components = await this.analyzePageStructure();

      // 5. Capturar screenshots
      const screenshots = await this.captureScreenshots();

      // 6. Analisar interações
      const interactions = await this.analyzeInteractions();

      // 7. Detectar issues visuais
      const issues = await this.detectVisualIssues();

      // 8. Gerar sugestões de testes
      const testSuggestions = await this.generateTestSuggestions(components);

      // 9. Fechar browser
      await this.closeBrowser();

      return {
        timestamp: new Date().toISOString(),
        url,
        loadTime: pageData.loadTime,
        components,
        screenshots,
        interactions,
        issues,
        testSuggestions,
        summary: this.generateSummary(components, issues),
      };
    } catch (error) {
      await this.closeBrowser();
      throw error;
    }
  }

  /**
   * 🌐 Inicializa browser Puppeteer
   */
  async initializeBrowser() {
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: config.visual.screenshot.defaultViewport,
    });

    this.page = await this.browser.newPage();

    // Configurar interceptação de console logs
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`Console Error: ${msg.text()}`);
      }
    });
  }

  /**
   * 🔍 Detecta URL ativa para análise
   */
  async detectActiveUrl() {
    const ports = this.detection.activePorts;
    const basePort = ports[0]; // Usar primeira porta ativa

    return `http://localhost:${basePort}`;
  }

  /**
   * 📄 Carrega página e mede performance
   */
  async loadPage(url) {
    const startTime = Date.now();

    try {
      await this.page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Aguardar um pouco para garantir que componentes dinâmicos carregaram
      await this.page.waitForTimeout(2000);

      const loadTime = Date.now() - startTime;

      return {
        url,
        loadTime,
        success: true,
      };
    } catch (error) {
      throw new Error(`Erro ao carregar ${url}: ${error.message}`);
    }
  }

  /**
   * 🧩 Analisa estrutura e componentes da página
   */
  async analyzePageStructure() {
    const selectors = config.visual.selectors;

    const components = await this.page.evaluate((selectors) => {
      const results = [];

      // Analisar cada tipo de seletor
      Object.entries(selectors).forEach(([type, selectorList]) => {
        selectorList.forEach((selector) => {
          const elements = document.querySelectorAll(selector);

          elements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();

            // Só incluir elementos visíveis
            if (rect.width > 0 && rect.height > 0) {
              results.push({
                type,
                selector,
                id: element.id || `${type}-${index}`,
                classes: element.className,
                text: element.textContent?.substring(0, 100) || "",
                position: {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                },
                visible: true,
                attributes: {
                  tagName: element.tagName.toLowerCase(),
                  role: element.getAttribute("role"),
                  ariaLabel: element.getAttribute("aria-label"),
                  href: element.href,
                  src: element.src,
                },
              });
            }
          });
        });
      });

      return results;
    }, selectors);

    // Deduplicar componentes baseado em posição similar
    return this.deduplicateComponents(components);
  }

  /**
   * 📸 Captura diferentes tipos de screenshots
   */
  async captureScreenshots() {
    await fs.ensureDir(this.screenshotDir);

    const screenshots = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      // 1. Screenshot completo da página
      const fullPagePath = path.join(
        this.screenshotDir,
        `full-page-${timestamp}.png`
      );
      await this.page.screenshot({
        path: fullPagePath,
        fullPage: true,
      });

      screenshots.push({
        type: "full-page",
        filename: path.basename(fullPagePath),
        path: fullPagePath,
        timestamp,
      });

      // 2. Screenshot do viewport atual
      const viewportPath = path.join(
        this.screenshotDir,
        `viewport-${timestamp}.png`
      );
      await this.page.screenshot({
        path: viewportPath,
        fullPage: false,
      });

      screenshots.push({
        type: "viewport",
        filename: path.basename(viewportPath),
        path: viewportPath,
        timestamp,
      });

      // 3. Screenshots responsivos (se aplicável)
      const responsiveScreenshots = await this.captureResponsiveScreenshots(
        timestamp
      );
      screenshots.push(...responsiveScreenshots);
    } catch (error) {
      console.warn(`Erro ao capturar screenshots: ${error.message}`);
    }

    return screenshots;
  }

  /**
   * 📱 Captura screenshots responsivos
   */
  async captureResponsiveScreenshots(timestamp) {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1920, height: 1080 },
    ];

    const screenshots = [];

    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await this.page.waitForTimeout(1000); // Aguardar re-render

        const filename = `responsive-${viewport.name}-${timestamp}.png`;
        const filepath = path.join(this.screenshotDir, filename);

        await this.page.screenshot({
          path: filepath,
          fullPage: false,
        });

        screenshots.push({
          type: "responsive",
          viewport: viewport.name,
          filename,
          path: filepath,
          timestamp,
        });
      } catch (error) {
        console.warn(
          `Erro ao capturar screenshot ${viewport.name}: ${error.message}`
        );
      }
    }

    // Restaurar viewport original
    await this.page.setViewport(config.visual.screenshot.defaultViewport);

    return screenshots;
  }

  /**
   * 🎯 Analisa interações possíveis
   */
  async analyzeInteractions() {
    const interactions = [];

    try {
      // Detectar elementos clicáveis
      const clickableElements = await this.page.$$eval(
        'button, a, [role="button"], input[type="submit"], [onclick]',
        (elements) =>
          elements.map((el, index) => ({
            type: "clickable",
            id: el.id || `clickable-${index}`,
            text: el.textContent?.trim() || el.value || "",
            tagName: el.tagName.toLowerCase(),
            href: el.href,
            disabled: el.disabled,
          }))
      );

      interactions.push(...clickableElements);

      // Detectar formulários
      const forms = await this.page.$$eval("form", (forms) =>
        forms.map((form, index) => ({
          type: "form",
          id: form.id || `form-${index}`,
          method: form.method || "GET",
          action: form.action || "",
          inputs: form.querySelectorAll("input, textarea, select").length,
        }))
      );

      interactions.push(...forms);
    } catch (error) {
      console.warn(`Erro ao analisar interações: ${error.message}`);
    }

    return interactions;
  }

  /**
   * 🚨 Detecta issues visuais básicos
   */
  async detectVisualIssues() {
    const issues = [];

    try {
      // Verificar elementos fora da viewport
      const elementsOutOfView = await this.page.evaluate(() => {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        const outOfView = [];
        document.querySelectorAll("*").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (
            rect.right < 0 ||
            rect.bottom < 0 ||
            rect.left > viewport.width ||
            rect.top > viewport.height
          ) {
            if (rect.width > 0 && rect.height > 0) {
              outOfView.push(el.tagName);
            }
          }
        });

        return outOfView.length;
      });

      if (elementsOutOfView > 0) {
        issues.push(`${elementsOutOfView} elementos fora da viewport`);
      }

      // Verificar texto muito pequeno
      const smallTextElements = await this.page.evaluate(() => {
        const smallText = [];
        document.querySelectorAll("*").forEach((el) => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 12 && el.textContent?.trim()) {
            smallText.push(el.tagName);
          }
        });
        return smallText.length;
      });

      if (smallTextElements > 0) {
        issues.push(
          `${smallTextElements} elementos com texto muito pequeno (<12px)`
        );
      }

      // Verificar elementos sem texto alternativo
      const imagesWithoutAlt = await this.page.$$eval(
        "img:not([alt])",
        (imgs) => imgs.length
      );
      if (imagesWithoutAlt > 0) {
        issues.push(`${imagesWithoutAlt} imagens sem texto alternativo`);
      }

      // Verificar botões sem label
      const buttonsWithoutLabel = await this.page.$$eval(
        "button:not([aria-label]):not([title])",
        (buttons) => buttons.filter((btn) => !btn.textContent?.trim()).length
      );

      if (buttonsWithoutLabel > 0) {
        issues.push(`${buttonsWithoutLabel} botões sem label acessível`);
      }
    } catch (error) {
      console.warn(`Erro ao detectar issues visuais: ${error.message}`);
    }

    return issues;
  }

  /**
   * 🧪 Gera sugestões de testes baseadas na análise
   */
  async generateTestSuggestions(components) {
    const suggestions = [];

    // Agrupar componentes por tipo
    const componentsByType = components.reduce((acc, comp) => {
      acc[comp.type] = (acc[comp.type] || 0) + 1;
      return acc;
    }, {});

    // Sugestões baseadas em componentes encontrados
    if (componentsByType.forms > 0) {
      suggestions.push({
        type: "Form Testing",
        description: `Testar ${componentsByType.forms} formulários encontrados`,
        code: `// Teste de formulário
test('should submit form with valid data', async () => {
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});`,
      });
    }

    if (componentsByType.buttons > 0) {
      suggestions.push({
        type: "Button Interaction",
        description: `Testar ${componentsByType.buttons} botões interativos`,
        code: `// Teste de botão
test('should handle button clicks', async () => {
  await page.click('button');
  // Verificar mudança de estado ou navegação
  await expect(page).toHaveURL(/expected-url/);
});`,
      });
    }

    if (componentsByType.navigation > 0) {
      suggestions.push({
        type: "Navigation Testing",
        description: `Testar ${componentsByType.navigation} elementos de navegação`,
        code: `// Teste de navegação
test('should navigate through menu items', async () => {
  await page.click('nav a[href="/about"]');
  await expect(page).toHaveURL(/about/);
  await expect(page.locator('h1')).toContainText('About');
});`,
      });
    }

    // Sugestões de testes visuais
    suggestions.push({
      type: "Visual Regression",
      description: "Detectar mudanças visuais não intencionais",
      code: `// Teste de regressão visual
test('should maintain visual consistency', async () => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});`,
    });

    // Sugestões de acessibilidade
    suggestions.push({
      type: "Accessibility",
      description: "Verificar conformidade com WCAG",
      code: `// Teste de acessibilidade
test('should be accessible', async () => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});`,
    });

    // Sugestões de responsividade
    suggestions.push({
      type: "Responsive Design",
      description: "Testar layout em diferentes tamanhos de tela",
      code: `// Teste responsivo
test('should work on mobile devices', async () => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.locator('.mobile-menu')).toBeVisible();
});`,
    });

    return suggestions;
  }

  /**
   * 📊 Gera resumo da análise
   */
  generateSummary(components, issues) {
    const totalComponents = components.length;
    const componentTypes = [...new Set(components.map((c) => c.type))].length;
    const issueCount = issues.length;

    if (issueCount === 0 && totalComponents > 5) {
      return `✅ Interface bem estruturada com ${totalComponents} componentes detectados (${componentTypes} tipos diferentes). Nenhum issue visual encontrado.`;
    } else if (issueCount <= 2) {
      return `👍 Interface funcional com ${totalComponents} componentes. ${issueCount} issue${
        issueCount !== 1 ? "s" : ""
      } menor${issueCount !== 1 ? "es" : ""} detectado${
        issueCount !== 1 ? "s" : ""
      }.`;
    } else {
      return `⚠️ Interface com ${totalComponents} componentes mas ${issueCount} issues detectados que podem afetar usabilidade e acessibilidade.`;
    }
  }

  /**
   * 🔧 Remove componentes duplicados baseado em posição
   */
  deduplicateComponents(components) {
    const unique = [];

    components.forEach((comp) => {
      const isDuplicate = unique.some(
        (existing) =>
          Math.abs(existing.position.x - comp.position.x) < 5 &&
          Math.abs(existing.position.y - comp.position.y) < 5 &&
          existing.type === comp.type
      );

      if (!isDuplicate) {
        unique.push(comp);
      }
    });

    return unique;
  }

  /**
   * 🚀 Fecha browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export default VisualAnalyzer;
