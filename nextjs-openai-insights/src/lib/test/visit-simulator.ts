"use client";

export interface VisitSimulationResult {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  steps: Array<{
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    error?: string;
  }>;
  success: boolean;
}

export async function simulateFullVisit(): Promise<VisitSimulationResult> {
  const id = `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const steps: VisitSimulationResult["steps"] = [];
  let overallSuccess = true;
  let sessionId: string | undefined;
  let companyId: string | undefined;
  let firstTileId: string | undefined;
  let createdTileId: string | undefined;

  // Step 1: Criar Workspace (Form Submission)
  try {
    const stepStart = performance.now();
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salesRepCompany: "Test Company",
        salesRepWebsite: "https://test.com",
        solution: "Test Solution",
        targetCompany: "Target Company",
        targetWebsite: "https://target.com",
        templateId: "template_1",
      }),
    });

    const stepEnd = performance.now();
    const success = response.ok;
    if (!success) overallSuccess = false;

    steps.push({
      name: "1. Criar Workspace (Form)",
      startTime: stepStart,
      endTime: stepEnd,
      duration: stepEnd - stepStart,
      success,
      error: success ? undefined : `Status ${response.status}`,
    });

    if (!success) {
      throw new Error(`Failed to create workspace: ${response.status}`);
    }

    const data = await response.json();
    const workspace = data.workspace;
    sessionId = data.sessionId || workspace?.sessionId;
    companyId = workspace?.company?.id || workspace?.sessionId;

    if (!workspace || !workspace.company?.tiles?.length) {
      throw new Error("Workspace created but no tiles found");
    }

    firstTileId = workspace.company.tiles[0]?.id;

    // Step 2: Criar Tile Individual (Add Single)
    try {
      const tileStart = performance.now();
      const tileResponse = await fetch("/api/workspace/tiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Custom Tile",
          prompt: "Analyze the market opportunities for this company",
          useMaxPrompt: false,
          requestSize: "small",
        }),
      });

      const tileEnd = performance.now();
      const tileSuccess = tileResponse.ok;
      if (!tileSuccess) overallSuccess = false;

      steps.push({
        name: "2. Criar Tile Individual (Add Single)",
        startTime: tileStart,
        endTime: tileEnd,
        duration: tileEnd - tileStart,
        success: tileSuccess,
        error: tileSuccess ? undefined : `Status ${tileResponse.status}`,
      });

      if (tileSuccess) {
        const tileData = await tileResponse.json();
        createdTileId = tileData.tile?.id;
      }
    } catch (error) {
      overallSuccess = false;
      steps.push({
        name: "2. Criar Tile Individual (Add Single)",
        startTime: performance.now(),
        endTime: performance.now(),
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Step 3: Criar Blank Dashboard
    if (companyId) {
      try {
        const dashStart = performance.now();
        // Criar blank dashboard via localStorage (função client-side)
        // Como não temos API direta, vamos simular via POST /api/dashboards
        const companiesResponse = await fetch("/api/dashboards");
        const companiesData = await companiesResponse.json();
        const company = companiesData.companies?.find((c: { id: string }) => c.id === companyId);
        
        if (company) {
          // Criar novo dashboard em branco
          const newDashboard = {
            id: `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: "Test Blank Dashboard",
            companyId: company.id,
            tiles: [],
            notes: [],
            contacts: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: false,
          };

          // Desativar outros dashboards
          company.dashboards?.forEach((d: { isActive: boolean }) => {
            d.isActive = false;
          });
          newDashboard.isActive = true;

          // Adicionar novo dashboard
          if (!company.dashboards) company.dashboards = [];
          company.dashboards.push(newDashboard);
          company.updatedAt = new Date().toISOString();

          // Salvar via API
          const saveResponse = await fetch("/api/dashboards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company }),
          });

          const dashEnd = performance.now();
          const dashSuccess = saveResponse.ok;
          if (!dashSuccess) overallSuccess = false;

          steps.push({
            name: "3. Criar Blank Dashboard",
            startTime: dashStart,
            endTime: dashEnd,
            duration: dashEnd - dashStart,
            success: dashSuccess,
            error: dashSuccess ? undefined : `Status ${saveResponse.status}`,
          });
        } else {
          throw new Error("Company not found");
        }
      } catch (error) {
        overallSuccess = false;
        steps.push({
          name: "3. Criar Blank Dashboard",
          startTime: performance.now(),
          endTime: performance.now(),
          duration: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Step 4: Chat em Tile
    if (firstTileId) {
      try {
        const chatStart = performance.now();
        const chatResponse = await fetch(
          `/api/workspace/tiles/${firstTileId}/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "Tell me more about this",
            }),
          }
        );

        const chatEnd = performance.now();
        const chatSuccess = chatResponse.ok;
        if (!chatSuccess) overallSuccess = false;

        steps.push({
          name: "4. Chat em Tile",
          startTime: chatStart,
          endTime: chatEnd,
          duration: chatEnd - chatStart,
          success: chatSuccess,
          error: chatSuccess ? undefined : `Status ${chatResponse.status}`,
        });
      } catch (error) {
        overallSuccess = false;
        steps.push({
          name: "4. Chat em Tile",
          startTime: performance.now(),
          endTime: performance.now(),
          duration: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Step 5: Regenerar Tile
    if (createdTileId) {
      try {
        const regenStart = performance.now();
        const regenResponse = await fetch(
          `/api/workspace/tiles/${createdTileId}/regenerate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              useMaxPrompt: false,
            }),
          }
        );

        const regenEnd = performance.now();
        const regenSuccess = regenResponse.ok;
        if (!regenSuccess) overallSuccess = false;

        steps.push({
          name: "5. Regenerar Tile",
          startTime: regenStart,
          endTime: regenEnd,
          duration: regenEnd - regenStart,
          success: regenSuccess,
          error: regenSuccess ? undefined : `Status ${regenResponse.status}`,
        });
      } catch (error) {
        overallSuccess = false;
        steps.push({
          name: "5. Regenerar Tile",
          startTime: performance.now(),
          endTime: performance.now(),
          duration: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Step 6: Criar Contato
    try {
      const contactStart = performance.now();
      const contactResponse = await fetch("/api/workspace/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Contact",
          role: "CEO",
        }),
      });

      const contactEnd = performance.now();
      const contactSuccess = contactResponse.ok;
      if (!contactSuccess) overallSuccess = false;

      steps.push({
        name: "Criar Contato",
        startTime: contactStart,
        endTime: contactEnd,
        duration: contactEnd - contactStart,
        success: contactSuccess,
        error: contactSuccess ? undefined : `Status ${contactResponse.status}`,
      });
    } catch (error) {
      overallSuccess = false;
      steps.push({
        name: "Criar Contato",
        startTime: performance.now(),
        endTime: performance.now(),
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Step 7: Criar Nota
    try {
      const noteStart = performance.now();
      const noteResponse = await fetch("/api/workspace/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Note",
          content: "This is a test note",
        }),
      });

      const noteEnd = performance.now();
      const noteSuccess = noteResponse.ok;
      if (!noteSuccess) overallSuccess = false;

      steps.push({
        name: "Criar Nota",
        startTime: noteStart,
        endTime: noteEnd,
        duration: noteEnd - noteStart,
        success: noteSuccess,
        error: noteSuccess ? undefined : `Status ${noteResponse.status}`,
      });
    } catch (error) {
      overallSuccess = false;
      steps.push({
        name: "Criar Nota",
        startTime: performance.now(),
        endTime: performance.now(),
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } catch (error) {
    overallSuccess = false;
    if (steps.length === 0) {
      steps.push({
        name: "Criar Workspace",
        startTime: performance.now(),
        endTime: performance.now(),
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const endTime = Date.now();

  return {
    id,
    startTime,
    endTime,
    duration: endTime - startTime,
    steps,
    success: overallSuccess,
  };
}

