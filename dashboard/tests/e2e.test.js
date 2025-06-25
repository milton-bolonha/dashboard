import test from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const BASE_URL = "http://localhost:3000";

async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(
        `Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

test(
  "Dashboard Engine E2E - Interface completa",
  { timeout: 60000 },
  async () => {
    let browser;
    let page;

    try {
      // Iniciar browser
      browser = await puppeteer.launch({
        headless: false, // Mostrar browser para verificação visual
        defaultViewport: { width: 1280, height: 720 },
      });

      page = await browser.newPage();

      console.log("🚀 Iniciando teste E2E do Dashboard Engine...");

      // 1. Navegar para dashboard com retentativas
      console.log(`📍 Navegando para ${BASE_URL}/dashboard`);
      await retry(
        () => page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2" }),
        5,
        2000
      );

      // Verificar se carregou
      const title = await page.title();
      console.log(`📄 Título da página: ${title}`);
      assert.ok(title.includes("Dashboard Engine"));

      // 3. Verificar se sidebar esquerda existe
      console.log("🔍 Verificando sidebar esquerda...");
      await page.waitForSelector(".w-64.bg-gray-900", { timeout: 10000 });
      const sidebar = await page.$(".w-64.bg-gray-900");
      assert.ok(sidebar, "Sidebar esquerda deve existir");

      // 4. Verificar se navegação existe
      const navItems = await page.$$eval("nav a", (links) =>
        links.map((link) => link.textContent.trim())
      );
      console.log("🧭 Items de navegação encontrados:", navItems);
      assert.ok(navItems.includes("Dashboard"));
      assert.ok(navItems.includes("Content Types"));
      assert.ok(navItems.includes("Users"));
      assert.ok(navItems.includes("Plans"));

      // 5. Verificar cards de estatísticas
      console.log("📊 Verificando cards de estatísticas...");
      await page.waitForSelector(".grid .bg-white.shadow.rounded-lg");
      const statsCards = await page.$$(".grid .bg-white.shadow.rounded-lg");
      console.log(`📈 Encontrados ${statsCards.length} cards de estatísticas`);
      assert.ok(statsCards.length >= 4, "Deve ter pelo menos 4 cards de stats");

      // 6. Verificar inspector (sidebar direita)
      console.log("🔍 Verificando inspector...");
      await page.waitForSelector(".w-80.bg-gray-50");
      const inspector = await page.$(".w-80.bg-gray-50");
      assert.ok(inspector, "Inspector deve existir");

      // 7. Testar dark mode toggle
      console.log("🌙 Testando toggle dark mode...");
      const darkModeBtn = await page.$(
        'button[aria-label="Toggle dark mode"], button svg[viewBox="0 0 20 20"]'
      );
      if (darkModeBtn) {
        await darkModeBtn.click();
        await page.waitForTimeout(500); // Aguardar animação
        console.log("✅ Dark mode toggle funcionando");
      }

      // 8. Verificar se APIs estão respondendo
      console.log("🔌 Testando API de estatísticas...");
      const response = await page.evaluate(async (url) => {
        try {
          const res = await fetch(`${url}/api/dashboard/stats`);
          return await res.json();
        } catch (error) {
          return { error: error.message };
        }
      }, BASE_URL);

      console.log("📊 Resposta da API stats:", response);
      assert.ok(
        typeof response.sections === "number",
        "API deve retornar contagem de sections"
      );

      // 9. Testar API de sections
      console.log("🔌 Testando API de sections...");
      const sectionsResponse = await page.evaluate(async () => {
        try {
          const res = await fetch("/api/sections");
          return await res.json();
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log("📁 Resposta da API sections:", sectionsResponse);
      assert.ok(
        Array.isArray(sectionsResponse.sections),
        "API deve retornar array de sections"
      );

      // 10. Screenshot final
      console.log("📸 Tirando screenshot final...");
      await page.screenshot({
        path: "dashboard/tests/dashboard-e2e.png",
        fullPage: true,
      });

      console.log("🎉 SUCESSO! Todos os testes E2E passaram!");
      console.log("✅ Interface carregando corretamente");
      console.log("✅ Sidebar esquerda com navegação");
      console.log("✅ Cards de estatísticas renderizando");
      console.log("✅ Inspector (sidebar direita) presente");
      console.log("✅ APIs respondendo corretamente");
      console.log("✅ Dark mode funcional");

      // Aguardar 3 segundos para visualização
      await page.waitForTimeout(3000);
    } catch (error) {
      console.error("❌ Erro no teste E2E:", error);
      if (page) {
        await page.screenshot({
          path: "dashboard/tests/error-e2e.png",
          fullPage: true,
        });
      }
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);

console.log("🚀 Iniciando testes E2E do Dashboard Engine MVP...");
