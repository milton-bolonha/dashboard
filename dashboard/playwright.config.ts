import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Timeout máximo para cada teste */
  timeout: 120000, // 2 minutos (precisa esperar OpenAI gerar tiles)
  expect: {
    timeout: 10000,
  },
  /* Executar testes em paralelo */
  fullyParallel: true,
  /* Falhar build se testes falharem */
  forbidOnly: !!process.env.CI,
  /* Re-executar testes em CI quando falharem */
  retries: process.env.CI ? 2 : 0,
  /* Desabilitar workers em CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter para usar */
  reporter: "html",
  /* Opções compartilhadas para todos os projetos */
  use: {
    /* Base URL para usar em navegação como `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Coletar trace quando re-executar testes falhados */
    trace: "on-first-retry",
    /* Screenshots em caso de falha */
    screenshot: "only-on-failure",
  },

  /* Configurar projetos para diferentes navegadores */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Servidor de desenvolvimento do Next.js */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
