import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";

/**
 * Hook para controle de acesso
 *
 * Este hook fornece uma interface simples para verificar permissões
 * e gerenciar acesso em componentes React
 */
export function useAccess() {
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();

  const [accessState, setAccessState] = useState({
    ready: false,
    plan: null,
    features: [],
    limits: {},
    usage: {},
    member: null,
  });

  // Carregar dados de acesso
  useEffect(() => {
    if (!user || !currentWorkspace) {
      setAccessState((prev) => ({ ...prev, ready: false }));
      return;
    }

    loadAccessData();
  }, [user, currentWorkspace]);

  const loadAccessData = async () => {
    try {
      const response = await fetch("/api/access/user-permissions", {
        headers: {
          "x-workspace-id": currentWorkspace._id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccessState({
          ready: true,
          ...data,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      setAccessState((prev) => ({ ...prev, ready: true }));
    }
  };

  /**
   * Verifica se pode executar uma ação
   */
  const can = useCallback(
    async (action, resourceType, resource = null) => {
      if (!accessState.ready) return false;

      try {
        const response = await fetch("/api/access/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-workspace-id": currentWorkspace?._id,
          },
          body: JSON.stringify({
            action,
            resourceType,
            resourceId: resource?._id,
          }),
        });

        const result = await response.json();
        return result.allowed;
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        return false;
      }
    },
    [accessState.ready, currentWorkspace]
  );

  /**
   * Verifica permissão de forma síncrona (baseado em cache local)
   */
  const canSync = useCallback(
    (action, resourceType) => {
      if (!accessState.ready) return false;

      // Super admin pode tudo
      if (user?.publicMetadata?.role === "superadmin") return true;

      // Owner do workspace pode tudo
      if (currentWorkspace?.ownerId === user?.id) return true;

      // Verificar role
      const member = accessState.member;
      if (!member) return false;

      const permission = `${resourceType}.${action}`;
      const rolePermissions = accessState.rolePermissions || {};

      return rolePermissions[permission]?.includes(member.role) || false;
    },
    [accessState, user, currentWorkspace]
  );

  /**
   * Verifica se tem uma feature
   */
  const hasFeature = useCallback(
    (featureSlug) => {
      if (!accessState.ready) return false;

      return accessState.features?.includes(featureSlug) || false;
    },
    [accessState]
  );

  /**
   * Verifica limites
   */
  const checkLimit = useCallback(
    (limitType) => {
      if (!accessState.ready) return { allowed: true, current: 0, max: null };

      const current = accessState.usage?.[limitType] || 0;
      const max = accessState.limits?.[limitType];

      if (!max || max === -1) {
        return { allowed: true, current, max: null };
      }

      return {
        allowed: current < max,
        current,
        max,
        remaining: max - current,
      };
    },
    [accessState]
  );

  /**
   * Obtém opções de upgrade
   */
  const getUpgradeOptions = useCallback(
    async (feature) => {
      try {
        const response = await fetch(
          `/api/access/upgrade-options?feature=${feature}`,
          {
            headers: {
              "x-workspace-id": currentWorkspace?._id,
            },
          }
        );

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error("Erro ao buscar opções de upgrade:", error);
      }

      return [];
    },
    [currentWorkspace]
  );

  /**
   * Navega para página de upgrade
   */
  const navigateToUpgrade = useCallback(
    (options = {}) => {
      const params = new URLSearchParams({
        source: options.source || "access_denied",
        feature: options.feature || "",
        plan: options.plan || "",
        ...options.params,
      });

      router.push(`/dashboard/billing?${params.toString()}`);
    },
    [router]
  );

  /**
   * Componente de proteção inline
   */
  const Protected = useMemo(() => {
    return function ProtectedComponent({
      children,
      action,
      resourceType,
      fallback = null,
      showUpgrade = true,
      resource = null,
    }) {
      const [allowed, setAllowed] = useState(null);
      const [upgradeOptions, setUpgradeOptions] = useState([]);

      useEffect(() => {
        checkAccess();
      }, [action, resourceType, resource]);

      const checkAccess = async () => {
        const isAllowed = await can(action, resourceType, resource);
        setAllowed(isAllowed);

        if (!isAllowed && showUpgrade) {
          const options = await getUpgradeOptions(`${resourceType}.${action}`);
          setUpgradeOptions(options);
        }
      };

      if (allowed === null) {
        return <div className="animate-pulse">Verificando acesso...</div>;
      }

      if (!allowed) {
        if (fallback) return fallback;

        if (showUpgrade && upgradeOptions.length > 0) {
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Você não tem permissão para {action} {resourceType}.
              </p>
              <button
                onClick={() =>
                  navigateToUpgrade({
                    feature: `${resourceType}.${action}`,
                    options: upgradeOptions,
                  })
                }
                className="text-sm text-yellow-600 hover:text-yellow-700 underline"
              >
                Ver opções de upgrade
              </button>
            </div>
          );
        }

        return null;
      }

      return children;
    };
  }, [can, getUpgradeOptions, navigateToUpgrade]);

  // Atalhos úteis
  const shortcuts = useMemo(
    () => ({
      // Sections
      canCreateSection: canSync("create", "sections"),
      canEditSection: canSync("edit", "sections"),
      canDeleteSection: canSync("delete", "sections"),

      // Items
      canCreateItem: canSync("create", "items"),
      canEditItem: canSync("edit.any", "items"),
      canDeleteItem: canSync("delete.any", "items"),

      // Admin
      canManageBilling: canSync("manage", "billing"),
      canInviteMembers: canSync("invite", "members"),
      canChangeRoles: canSync("changeRole", "members"),

      // Content Types
      canCreateContentType: canSync("create", "contentTypes"),
      canEditContentType: canSync("edit", "contentTypes"),

      // Settings
      canViewSettings: canSync("view", "settings"),
      canEditSettings: canSync("edit", "settings"),
    }),
    [canSync]
  );

  return {
    // Estado
    ready: accessState.ready,
    plan: accessState.plan,
    features: accessState.features,
    limits: accessState.limits,
    usage: accessState.usage,
    member: accessState.member,

    // Métodos
    can,
    canSync,
    hasFeature,
    checkLimit,
    getUpgradeOptions,
    navigateToUpgrade,
    reload: loadAccessData,

    // Componente
    Protected,

    // Atalhos
    ...shortcuts,
  };
}
