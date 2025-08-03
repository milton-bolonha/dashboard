"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [sectionsRefreshTrigger, setSectionsRefreshTrigger] = useState(0);

  // Carregar workspaces do usuário
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  /**
   * Carrega todos os workspaces do usuário
   */
  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("WorkspaceContext: Iniciando loadWorkspaces...");

      const response = await fetch("/api/workspaces");
      console.log(
        `WorkspaceContext: Resposta da API /api/workspaces - Status: ${response.status}`
      );

      // Tratar 404 (usuário sem workspaces) como um estado válido, não um erro.
      if (response.status === 404) {
        console.log("✅ Nenhum workspace encontrado para o usuário (404).");
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `WorkspaceContext: Erro na resposta da API. Status: ${response.status}, Texto: ${errorText}`
        );
        // Em caso de erro, NÃO setar currentWorkspace como null, apenas mostrar erro
        setError(
          `Falha ao carregar workspaces: ${response.status} ${response.statusText}`
        );
        setLoading(false);
        return;
      }

      const data = await response.json();
      const workspacesList = data.workspaces || [];
      setWorkspaces(workspacesList);
      console.log(
        `WorkspaceContext: ${workspacesList.length} workspaces carregados.`
      );

      // Se não há workspaces, não bloquear o sistema
      if (workspacesList.length === 0) {
        console.log(
          "🔧 Nenhum workspace encontrado, será criado automaticamente"
        );
        setCurrentWorkspace(null);
      } else {
        // Definir workspace atual se não tiver
        if (!currentWorkspace) {
          const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
          let workspace = null;

          if (savedWorkspaceId) {
            workspace = workspacesList.find((w) => w._id === savedWorkspaceId);

            // Se o workspace salvo não existe mais (transferido/deletado), limpar localStorage
            if (!workspace) {
              console.log(
                `⚠️ Workspace ${savedWorkspaceId} não encontrado, removendo do localStorage`
              );
              localStorage.removeItem("currentWorkspaceId");
              workspace = workspacesList[0]; // Usar o primeiro disponível
            }
          } else {
            workspace = workspacesList[0]; // Primeiro workspace como padrão
          }

          setCurrentWorkspace(workspace || workspacesList[0]);
          console.log(
            "WorkspaceContext: Workspace atual definido:",
            workspace || workspacesList[0]
          );
        }
      }
    } catch (err) {
      console.error(
        "WorkspaceContext: Erro CRÍTICO no bloco catch do loadWorkspaces:",
        err
      );
      setError(err.message);
      // Em caso de erro, NÃO setar currentWorkspace como null, apenas mostrar erro
      setLoading(false);
      return;
    } finally {
      setLoading(false);
      console.log("WorkspaceContext: loadWorkspaces finalizado.");
    }
  };

  /**
   * Cria um novo workspace
   */
  const createWorkspace = async (data) => {
    try {
      console.log("🚀 Criando workspace via contexto:", data);

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar workspace");
      }

      const result = await response.json();
      console.log("✅ Workspace criado:", result.workspace);

      // Atualizar lista de workspaces imediatamente
      const newWorkspace = result.workspace;
      setWorkspaces((prev) => [...prev, newWorkspace]);

      // Definir como workspace atual
      setCurrentWorkspace(newWorkspace);
      localStorage.setItem("currentWorkspaceId", newWorkspace._id);

      console.log("✅ Workspace ativado:", newWorkspace.name);

      // ✅ NOVO: Redirecionar para dashboard após criar novo workspace
      // Novo workspace não terá as sections/items da página atual
      const shouldRedirect = pathname !== "/dashboard";

      if (shouldRedirect) {
        console.log(
          `🔄 Redirecionando de "${pathname}" para "/dashboard" após criar novo workspace`
        );
        router.push("/dashboard");
      }

      return newWorkspace;
    } catch (err) {
      console.error("❌ Erro ao criar workspace:", err);
      throw err;
    }
  };

  /**
   * Alterna para outro workspace
   */
  const switchWorkspace = (workspace) => {
    console.log("🔄 Alternando para workspace:", workspace.name);

    setSwitching(true); // ← LOADING: Iniciar loading

    // ✅ NOVO: Verificar se precisa redirecionar após mudança de workspace
    // Só NÃO redirecionar se estiver na home do dashboard
    const shouldRedirect = pathname !== "/dashboard";

    setCurrentWorkspace(workspace);
    localStorage.setItem("currentWorkspaceId", workspace._id);

    console.log("✅ Workspace ativo:", workspace.name);

    // Forçar um re-render dos componentes dependentes, como a sidebar
    refreshSections();

    // ✅ NOVO: Redirecionar para dashboard se estava em página específica
    if (shouldRedirect) {
      console.log(
        `🔄 Redirecionando de "${pathname}" para "/dashboard" devido à mudança de workspace`
      );
      console.log(`📍 Workspace alterado para: ${workspace.name}`);
      router.push("/dashboard");
    } else {
      // Já estava na home do dashboard, não precisa redirecionar
      console.log(
        `✅ Permanecendo em /dashboard - Workspace ativo: ${workspace.name}`
      );
    }

    // Parar o indicador de "switching"
    // Um pequeno timeout pode ajudar a UI a "respirar"
    setTimeout(() => setSwitching(false), 300);
  };

  /**
   * Verifica se usuário tem permissão no workspace atual
   */
  const hasPermission = (permission) => {
    if (!currentWorkspace || !user) return false;

    const member = currentWorkspace.members?.find((m) => m.userId === user.id);
    if (!member) return false;

    // Owner tem todas as permissões
    if (member.role === "owner") return true;

    // Verificar permissão específica
    return member.permissions?.[permission] || false;
  };

  /**
   * Verifica se usuário tem papel específico
   */
  const hasRole = (role) => {
    if (!currentWorkspace || !user) return false;

    const member = currentWorkspace.members?.find((m) => m.userId === user.id);
    return member?.role === role;
  };

  /**
   * Verifica se pode realizar ação baseada no plano
   */
  const canPerformAction = (action, currentCount = 0) => {
    if (!currentWorkspace && action !== "createWorkspace") return false;

    // Para criar workspace, verificar apenas se o usuário está logado
    if (action === "createWorkspace") {
      return !!user;
    }

    const limits = currentWorkspace.limits || {};

    switch (action) {
      case "createContentType":
        return currentCount < (limits.maxContentTypes || 3);
      case "createSection":
        return currentCount < (limits.maxSections || 5);
      case "createItem":
        return currentCount < (limits.maxItems || 100);
      case "inviteUser":
        return currentCount < (limits.maxUsers || 1) && hasRole("owner");
      case "exportData":
        return hasPermission("canExport");
      default:
        return true;
    }
  };

  /**
   * Força refresh das sections (usado após criar/editar sections)
   */
  const refreshSections = () => {
    console.log("🔄 Forçando refresh das sections...");
    setSectionsRefreshTrigger((prev) => prev + 1);
  };

  const value = {
    // Estado
    workspaces,
    currentWorkspace,
    loading: loading || switching,
    switching,
    error,
    sectionsRefreshTrigger,

    // Ações
    loadWorkspaces,
    createWorkspace,
    switchWorkspace,
    refreshSections,

    // Verificações
    hasPermission,
    hasRole,
    canPerformAction,

    // Utilitários
    isOwner: hasRole("owner"),
    isAdmin: hasRole("admin") || hasRole("owner"),
    limits: currentWorkspace?.limits || {},
  };

  console.log(
    "WorkspaceContext: Renderizando provider. Loading:",
    loading || switching
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider");
  }
  return context;
}
