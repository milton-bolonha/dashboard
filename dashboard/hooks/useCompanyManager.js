import { useState, useEffect, useCallback } from "react";

export function useCompanyManager(workspace, jobInfo, jobId) {
  const [selectedCompany, setSelectedCompany] = useState(null);

  const getCompanyNameFromJob = useCallback(() => {
    if (!jobInfo || !jobInfo.dataSource || !jobInfo.dataSource.data) {
      return null;
    }
    const data = jobInfo.dataSource.data;

    // ⭐ CORREÇÃO: Lidar com `data.company` sendo um objeto ou uma string
    if (data.company) {
      if (typeof data.company === "object" && data.company.name) {
        return data.company.name;
      }
      if (typeof data.company === "string") {
        return data.company;
      }
    }

    // Fallback para outros campos
    return data.target || data.researchTarget || null;
  }, [jobInfo]);

  useEffect(() => {
    console.log("--- useCompanyManager Effect Triggered ---", {
      hasWorkspace: !!workspace,
      hasJobInfo: !!jobInfo,
      jobId,
    });

    // Se não há workspace, não há o que fazer.
    if (!workspace?.workspace) {
      // Se há um job mas ainda não há workspace, criar uma company temporária.
      if (jobId && jobInfo && !selectedCompany) {
        console.log(" decisión: Creating temporary company...");
        const companyName = getCompanyNameFromJob();
        const tempCompany = {
          id: `temp_${jobId}`,
          name: companyName,
          title: companyName,
          tiles: [],
          tiles_status: "generating",
          tiles_to_generate: jobInfo?.totals?.items || 8,
        };
        setSelectedCompany(tempCompany);
      }
      return;
    }

    // Lógica para extrair a lista de entidades (companies, books, etc.)
    const theme = workspace.workspace.themeSnapshot;
    let entities = [];
    if (theme) {
      const primaryEntity = theme.entities.find((e) => e.isPrimary);
      const entityKey = `${primaryEntity.id}s`.replace("companys", "companies");
      entities = workspace.workspace[entityKey] || [];
    } else {
      entities = workspace.workspace.companies || [];
    }

    if (entities.length === 0) {
      console.log(" decision: No entities found in workspace.");
      return;
    }

    // Se um job está ativo, a prioridade é a company do job.
    if (jobId && jobInfo) {
      const companyNameFromJob = getCompanyNameFromJob();
      const companyFromWorkspace = entities.find(
        (e) => e.name === companyNameFromJob || e.title === companyNameFromJob
      );

      // Se a company do job já existe no workspace, use-a.
      if (companyFromWorkspace) {
        console.log(
          ` decision: Found matching company in workspace: '${companyFromWorkspace.name}'`
        );
        // ⭐ FIX: Apenas atualizar se a company selecionada ainda não for a correta.
        // Isso previne o loop infinito.
        if (selectedCompany?.id !== companyFromWorkspace.id) {
          console.log(
            ` action: Setting selected company to workspace version (ID: ${companyFromWorkspace.id})`
          );
          // action: Setting selected company to workspace version (ID: ${companyFromWorkspace.id})
          // FIX: Previne race condition usando a forma funcional de setState.
          // Isso garante que estamos usando o `prevCompany` mais recente, preservando
          // quaisquer tiles que chegaram via SSE durante o carregamento do workspace.
          setSelectedCompany((prevCompany) => ({
            ...companyFromWorkspace,
            tiles_status:
              prevCompany?.tiles_status || companyFromWorkspace.tiles_status,
            // Mantém os tiles que já chegaram na company temporária
            tiles: prevCompany?.tiles || companyFromWorkspace.tiles || [],
          }));
        }
      }
    } else if (!selectedCompany && entities.length > 0) {
      console.log(
        " decision: No active job, setting selected company to first in list."
      );
      // Se não há job, e nenhuma company selecionada, selecionar a primeira da lista.
      setSelectedCompany(entities[0]);
    }
  }, [workspace, jobInfo, jobId, getCompanyNameFromJob, selectedCompany]);

  return { selectedCompany, setSelectedCompany, getCompanyNameFromJob };
}
