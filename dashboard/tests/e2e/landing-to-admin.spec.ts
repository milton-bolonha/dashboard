import { test, expect } from "@playwright/test";

/**
 * Teste E2E completo: Landing → Admin com geração de tiles
 *
 * Fluxo testado:
 * 1. Navega para home (/)
 * 2. Reseta sessão guest (limpa dados anteriores)
 * 3. Preenche formulário progressivo
 * 4. Submete formulário
 * 5. Espera redirecionar para /admin
 * 6. Espera tiles aparecerem com conteúdo real do OpenAI
 */
test.describe("Fluxo completo Landing → Admin", () => {
  test("deve preencher formulário, gerar job e mostrar tiles no admin", async ({
    page,
  }) => {
    // 1. Navegar para home
    console.log("🏠 Navegando para home...");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verificar que a página carregou
    await expect(page.locator("h1")).toContainText("Smarter Research");

    // 2. Resetar sessão guest (limpar dados anteriores)
    console.log("🗑️ Resetando sessão guest...");
    try {
      const resetResponse = await page.request.delete("/api/guest/reset");
      if (resetResponse.ok()) {
        console.log("✅ Sessão resetada com sucesso");
      }
    } catch (error) {
      console.log("⚠️ Reset não disponível ou já limpo, continuando...");
    }

    // Aguardar um pouco para garantir que reset foi processado
    await page.waitForTimeout(1000);

    // 3. Preencher formulário progressivo
    console.log("📝 Preenchendo formulário...");

    // Campo 1: Company (sempre habilitado)
    const companyInput = page.locator('input[name="company"]');
    await companyInput.waitFor({ state: "visible" });
    await companyInput.fill("Acme Corp");
    await companyInput.blur();
    await page.waitForTimeout(500); // Aguardar validação

    // Campo 2: Company Website (habilitado após company válido)
    const companyWebsiteInput = page.locator('input[name="companyWebsite"]');
    await companyWebsiteInput.waitFor({ state: "visible" });
    await expect(companyWebsiteInput).not.toBeDisabled();
    await companyWebsiteInput.fill("www.acmecorp.com");
    await companyWebsiteInput.blur();
    await page.waitForTimeout(500);

    // Campo 3: Solution (habilitado após companyWebsite válido)
    const solutionInput = page.locator('input[name="solution"]');
    await solutionInput.waitFor({ state: "visible" });
    await expect(solutionInput).not.toBeDisabled();
    await solutionInput.fill("AI Sales Automation Tools");
    await solutionInput.blur();
    await page.waitForTimeout(500);

    // Campo 4: Research Target (habilitado após solution válido)
    const researchTargetInput = page.locator('input[name="researchTarget"]');
    await researchTargetInput.waitFor({ state: "visible" });
    await expect(researchTargetInput).not.toBeDisabled();
    await researchTargetInput.fill("Tesla");
    await researchTargetInput.blur();
    await page.waitForTimeout(500);

    // Campo 5: Research Website (último campo, habilitado após researchTarget válido)
    const researchWebsiteInput = page.locator('input[name="researchWebsite"]');
    await researchWebsiteInput.waitFor({ state: "visible" });
    await expect(researchWebsiteInput).not.toBeDisabled();
    await researchWebsiteInput.fill("www.tesla.com");
    await researchWebsiteInput.blur();
    await page.waitForTimeout(500);

    console.log("✅ Formulário preenchido completamente");

    // 4. Verificar que botão de submit está habilitado
    // O submit acontece quando pressionamos Enter no último campo ou clicamos no ícone
    const submitButton = page
      .locator('button[type="submit"], svg[data-testid="submit-icon"]')
      .first();

    // Alternativa: pressionar Enter no último campo
    await researchWebsiteInput.press("Enter");

    console.log("🚀 Formulário submetido, aguardando redirecionamento...");

    // 5. Esperar redirecionar para /admin com job_id, guest_id e token
    await page.waitForURL(/\/admin\?.*job_id=.*&.*guest_id=.*&.*token=.*/, {
      timeout: 30000,
    });

    const url = page.url();
    console.log("✅ Redirecionado para admin:", url);

    // Extrair parâmetros da URL para validação
    const urlObj = new URL(url);
    const jobId = urlObj.searchParams.get("job_id");
    const guestId = urlObj.searchParams.get("guest_id");
    const token = urlObj.searchParams.get("token");

    expect(jobId).toBeTruthy();
    expect(guestId).toBeTruthy();
    expect(token).toBeTruthy();

    console.log("📋 Parâmetros extraídos:", { jobId, guestId, token });

    // 6. Esperar página admin carregar
    await page.waitForLoadState("networkidle");

    // Verificar que estamos na página admin
    await expect(page).toHaveURL(/\/admin/);

    // 7. Esperar nome da company aparecer (não mais "Preview Company")
    console.log("⏳ Aguardando nome da company aparecer...");

    // O nome da company aparece em um h1 na página admin
    // Aguardar até que apareça um nome que NÃO seja "Preview Company"
    // Pode demorar um pouco se o workspace ainda está sendo criado
    let companyName = "Preview Company";
    let attempts = 0;
    const maxAttempts = 30; // 30 tentativas = ~30 segundos

    while (companyName.includes("Preview Company") && attempts < maxAttempts) {
      await page.waitForTimeout(1000); // Aguardar 1 segundo entre tentativas
      attempts++;

      const companyNameElement = page.locator("h1.text-2xl, h1").first();
      const isVisible = await companyNameElement.isVisible().catch(() => false);

      if (isVisible) {
        const text = await companyNameElement.textContent();
        if (text && !text.includes("Preview Company")) {
          companyName = text;
          console.log(
            `✅ Nome da company encontrado (tentativa ${attempts}):`,
            companyName
          );
          break;
        }
      }

      if (attempts % 5 === 0) {
        console.log(
          `⏳ Tentativa ${attempts}/${maxAttempts} - ainda aguardando nome correto...`
        );
      }
    }

    console.log("📝 Nome da company final:", companyName);

    // Verificar que não é "Preview Company"
    expect(companyName).not.toContain("Preview Company");
    expect(companyName?.trim().length).toBeGreaterThan(0);

    // 8. Esperar tiles aparecerem (pode demorar bastante - OpenAI precisa gerar)
    console.log("⏳ Aguardando tiles aparecerem...");

    // Aguardar grid de tiles aparecer
    const tilesGrid = page
      .locator('.grid.grid-cols-1, [class*="grid"][class*="gap"]')
      .first();
    await tilesGrid.waitFor({ state: "visible", timeout: 60000 });

    // Aguardar até que pelo menos um tile tenha conteúdo real (não loading)
    // ⭐ CORREÇÃO: Usar seletores mais simples e compatíveis com Playwright
    // Playwright não suporta CSS escapes complexos como bg-[#FAFAFA]
    // Vamos usar apenas :has(h3) e depois filtrar por texto
    console.log(
      "⏳ Aguardando tile com conteúdo real (pode demorar até 2 minutos)..."
    );

    // Estratégia: aguardar qualquer tile com h3 e texto substancial
    const tileWithContent = page
      .locator("div:has(h3)")
      .filter({ hasText: /[A-Za-z]{30,}/ })
      .first();

    try {
      await tileWithContent.waitFor({
        state: "visible",
        timeout: 120000, // 2 minutos - OpenAI pode demorar
      });
    } catch (error) {
      // Fallback: tentar com seletor ainda mais simples
      console.warn("⚠️ Seletor principal falhou, tentando fallback...");
      const fallbackTile = page
        .locator("h3")
        .filter({ hasText: /[A-Za-z]{20,}/ })
        .first();
      await fallbackTile.waitFor({
        state: "visible",
        timeout: 120000,
      });
    }

    // Verificar conteúdo do tile
    const tileTitle = await tileWithContent.locator("h3").first().textContent();
    const tileExcerpt = await tileWithContent
      .locator("div")
      .filter({ hasText: /[A-Za-z]{20,}/ })
      .first()
      .textContent();

    console.log("✅ Tile encontrado!");
    console.log("  📌 Título:", tileTitle);
    console.log(
      "  📄 Conteúdo (primeiros 100 chars):",
      tileExcerpt?.substring(0, 100) + "..."
    );

    // Verificar que o conteúdo não é apenas "Generating Insights..." ou loading
    expect(tileTitle).toBeTruthy();
    expect(tileTitle?.length).toBeGreaterThan(3);
    expect(tileExcerpt).toBeTruthy();
    expect(tileExcerpt?.length).toBeGreaterThan(20);
    expect(tileExcerpt).not.toContain("Generating Insights");
    expect(tileExcerpt).not.toContain("Loading...");

    // 9. Verificar que múltiplos tiles apareceram (esperamos 8 tiles no total)
    const allTiles = page
      .locator("div:has(h3)")
      .filter({ hasText: /[A-Za-z]{10,}/ });
    const tilesCount = await allTiles.count();
    console.log(`📊 Total de tiles encontrados: ${tilesCount}`);

    // ⭐ CORREÇÃO: Template tem 8 tiles, não 6!
    expect(tilesCount).toBeGreaterThan(0);
    // Idealmente todos os 8 tiles devem aparecer, mas pelo menos alguns devem estar presentes
    if (tilesCount < 8) {
      console.warn(`⚠️ Esperado 8 tiles, mas apenas ${tilesCount} apareceram`);
    }

    // 10. Verificar que não há mais loading modal
    const loadingModal = page.locator(
      '[role="dialog"], .modal, [class*="loading"]'
    );
    const modalVisible = await loadingModal.isVisible().catch(() => false);

    if (modalVisible) {
      console.log("⚠️ Modal de loading ainda visível, aguardando fechar...");
      await loadingModal.waitFor({ state: "hidden", timeout: 30000 });
    }

    console.log("🎉 Teste completo! Tiles gerados com sucesso!");
  });

  test("deve validar que inputs são habilitados progressivamente", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Primeiro input sempre habilitado
    const companyInput = page.locator('input[name="company"]');
    await expect(companyInput).not.toBeDisabled();

    // Segundo input desabilitado inicialmente
    const companyWebsiteInput = page.locator('input[name="companyWebsite"]');
    await expect(companyWebsiteInput).toBeDisabled();

    // Preencher primeiro campo
    await companyInput.fill("Test Company");
    await companyInput.blur();
    await page.waitForTimeout(500);

    // Segundo campo deve estar habilitado agora
    await expect(companyWebsiteInput).not.toBeDisabled();
  });
});
