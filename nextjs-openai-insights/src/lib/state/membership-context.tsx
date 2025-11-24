"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { usePayment } from "./payment-context";
import { listStoredWorkspaces } from "@/lib/storage/workspace-browser";

export type GuestAction =
  | "tileChat"
  | "contactChat"
  | "regenerate"
  | "createContact"
  | "createWorkspace";

interface UsageResult {
  action: GuestAction;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
}

type UsageCounts = Record<GuestAction, number>;

interface MembershipContextValue {
  isMember: boolean;
  isGuest: boolean;
  stripeCheckoutUrl?: string;
  limits: Record<GuestAction, number>;
  usage: UsageCounts;
  evaluateUsage: (action: GuestAction) => UsageResult;
  consumeUsage: (action: GuestAction) => UsageResult;
  startCheckout: () => boolean;
  markMember: () => void;
  resetGuestUsage: () => void;
}

const MembershipContext = createContext<MembershipContextValue | undefined>(
  undefined
);

const MEMBERSHIP_STORAGE_KEY = "insights_membership_status";
const USAGE_STORAGE_KEY = "insights_guest_usage_v1";
const USAGE_VERSION = 1;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_LIMITS: Record<GuestAction, number> = {
  tileChat: 5,
  contactChat: 5,
  regenerate: 5,
  createContact: 5,
  createWorkspace: 3,
};

interface StoredUsageData {
  version: number;
  lastReset: number;
  counts: Partial<Record<GuestAction, number>>;
}

function createInitialUsage(): StoredUsageData {
  return {
    version: USAGE_VERSION,
    lastReset: Date.now(),
    counts: {},
  };
}

function loadStoredUsage(): StoredUsageData {
  if (typeof window === "undefined") {
    return createInitialUsage();
  }
  try {
    const raw = window.localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return createInitialUsage();
    const parsed = JSON.parse(raw) as StoredUsageData;
    if (
      !parsed ||
      parsed.version !== USAGE_VERSION ||
      typeof parsed.lastReset !== "number" ||
      !parsed.counts
    ) {
      return createInitialUsage();
    }
    return parsed;
  } catch {
    return createInitialUsage();
  }
}

function saveUsage(data: StoredUsageData) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(data);
    window.localStorage.setItem(USAGE_STORAGE_KEY, serialized);
    console.log("[Membership Context] 💾 Usage saved:", {
      action: "saveUsage",
      counts: data.counts,
      lastReset: new Date(data.lastReset).toISOString(),
      version: data.version,
    });
  } catch (error) {
    console.error("[Membership Context] ❌ Failed to save usage:", error);
    // ignore quota failures
  }
}

function ensureFreshUsage(data: StoredUsageData): StoredUsageData {
  const shouldReset =
    data.version !== USAGE_VERSION || Date.now() - data.lastReset > ONE_DAY_MS;
  if (shouldReset) {
    return createInitialUsage();
  }
  return data;
}

function buildUsageSnapshot(data: StoredUsageData): UsageCounts {
  const counts = data.counts ?? {};
  return {
    tileChat: counts.tileChat ?? 0,
    contactChat: counts.contactChat ?? 0,
    regenerate: counts.regenerate ?? 0,
    createContact: counts.createContact ?? 0,
    createWorkspace: counts.createWorkspace ?? 0,
  };
}

function getMembershipStatus(): "guest" | "member" {
  if (typeof window === "undefined") return "guest";
  const stored = window.localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
  return stored === "member" ? "member" : "guest";
}

export function MembershipProvider({ children }: PropsWithChildren) {
  const payment = usePayment();
  const [status, setStatus] = useState<"guest" | "member">(() =>
    typeof window === "undefined" ? "guest" : getMembershipStatus()
  );
  const usageRef = useRef<StoredUsageData>(createInitialUsage());
  const [usageSnapshot, setUsageSnapshot] = useState<UsageCounts>({
    tileChat: 0,
    contactChat: 0,
    regenerate: 0,
    createContact: 0,
    createWorkspace: 0,
  });
  const stripeCheckoutUrl =
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || undefined;

  const resetGuestUsage = useCallback(() => {
    usageRef.current = createInitialUsage();
    saveUsage(usageRef.current);
    setUsageSnapshot(buildUsageSnapshot(usageRef.current));
  }, []);

  const markMember = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MEMBERSHIP_STORAGE_KEY, "member");
    }
    setStatus("member");
    resetGuestUsage();
  }, [resetGuestUsage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    usageRef.current = ensureFreshUsage(loadStoredUsage());

    // ✅ CORREÇÃO: Detectar workspaces existentes e atualizar usage retroativamente
    // Isso corrige o problema de workspaces criados antes do tracking estar funcionando
    // IMPORTANTE: Contar apenas workspaces válidos (que têm dados reais)
    if (status === "guest") {
      try {
        const storedWorkspaces = listStoredWorkspaces();
        // Filtrar apenas workspaces válidos (que têm company name ou tiles)
        const validWorkspaces = storedWorkspaces.filter((entry) => {
          const snapshot = entry.snapshot;
          return (
            snapshot &&
            snapshot.company &&
            (snapshot.company.name !== "New Company" ||
              (snapshot.company.tiles && snapshot.company.tiles.length > 0) ||
              snapshot.generatedAt)
          );
        });

        const currentWorkspaceCount =
          usageRef.current.counts.createWorkspace ?? 0;
        const actualWorkspaceCount = validWorkspaces.length;

        console.log("[Membership Context] 🔍 Verificando workspaces:", {
          totalEncontrados: storedWorkspaces.length,
          validos: actualWorkspaceCount,
          contados: currentWorkspaceCount,
          workspaces: validWorkspaces.map((w) => ({
            sessionId: w.sessionId,
            companyName: w.snapshot?.company?.name,
            tilesCount: w.snapshot?.company?.tiles?.length || 0,
          })),
        });

        // Se há mais workspaces válidos do que contados, atualizar o usage
        if (actualWorkspaceCount > currentWorkspaceCount) {
          console.log(
            "[Membership Context] 🔧 Corrigindo usage retroativamente:",
            {
              workspacesValidos: actualWorkspaceCount,
              workspacesContados: currentWorkspaceCount,
              diferenca: actualWorkspaceCount - currentWorkspaceCount,
            }
          );

          // Atualizar o usage para refletir os workspaces válidos existentes
          // Mas não exceder o limite
          const limit = DEFAULT_LIMITS.createWorkspace;
          const correctedCount = Math.min(actualWorkspaceCount, limit);

          const nextCounts = {
            ...usageRef.current.counts,
            createWorkspace: correctedCount,
          };
          const nextUsage = {
            ...usageRef.current,
            counts: nextCounts,
          };
          usageRef.current = nextUsage;
          saveUsage(nextUsage);
          setUsageSnapshot(buildUsageSnapshot(nextUsage));

          console.log("[Membership Context] ✅ Usage corrigido:", {
            createWorkspace: correctedCount,
            limit,
          });
        } else if (actualWorkspaceCount < currentWorkspaceCount) {
          // Se há menos workspaces válidos do que contados, também corrigir
          console.log(
            "[Membership Context] 🔧 Corrigindo usage (menos workspaces válidos):",
            {
              workspacesValidos: actualWorkspaceCount,
              workspacesContados: currentWorkspaceCount,
            }
          );
          const nextCounts = {
            ...usageRef.current.counts,
            createWorkspace: actualWorkspaceCount,
          };
          const nextUsage = {
            ...usageRef.current,
            counts: nextCounts,
          };
          usageRef.current = nextUsage;
          saveUsage(nextUsage);
          setUsageSnapshot(buildUsageSnapshot(nextUsage));
        }
      } catch (error) {
        console.error(
          "[Membership Context] ❌ Erro ao corrigir usage retroativamente:",
          error
        );
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hasSuccess =
      searchParams.get("membership") === "success" ||
      searchParams.get("checkout") === "success";
    const sessionId = searchParams.get("session_id");

    if (hasSuccess) {
      // Se tem session_id, usar PaymentContext para verificar e completar pagamento
      if (sessionId && payment.status === "pending") {
        console.log(
          "[Membership Context] 🔍 Detected checkout success with session_id, verifying payment..."
        );
        payment.verifyPayment(sessionId).then((verified: boolean) => {
          if (verified) {
            // Completar pagamento (vai redirecionar para onboarding se necessário)
            payment.completePayment(sessionId);
          }
        });
      } else if (!sessionId) {
        // Sem session_id: não fazer nada aqui, deixar o componente mostrar modal de email
        // O modal será mostrado pelo componente que detecta checkout=success
        console.log(
          "[Membership Context] 🔍 Detected checkout success without session_id - email verification needed"
        );
      }

      searchParams.delete("membership");
      searchParams.delete("checkout");
      searchParams.delete("session_id");
      const newSearch = searchParams.toString();
      const nextUrl = `${window.location.pathname}${
        newSearch ? `?${newSearch}` : ""
      }${window.location.hash || ""}`;
      window.history.replaceState(null, "", nextUrl);
    }

    // Se pagamento foi completado, marcar como member
    if (payment.status === "paid") {
      startTransition(() => {
        markMember();
      });
    }

    setUsageSnapshot(buildUsageSnapshot(usageRef.current));
  }, [markMember, payment]);

  const evaluateUsage = useCallback(
    (action: GuestAction): UsageResult => {
      if (status === "member") {
        return {
          action,
          allowed: true,
          used: 0,
          remaining: Number.POSITIVE_INFINITY,
          limit: Number.POSITIVE_INFINITY,
        };
      }
      const usage = ensureFreshUsage(usageRef.current);
      usageRef.current = usage;
      // Não atualizar estado durante avaliação - apenas ler
      // setUsageSnapshot(buildUsageSnapshot(usage)); // Removido para evitar loop infinito
      const used = usage.counts[action] ?? 0;
      const limit = DEFAULT_LIMITS[action];
      const remaining = Math.max(limit - used, 0);
      return {
        action,
        allowed: used < limit,
        used,
        remaining,
        limit,
      };
    },
    [status]
  );

  const consumeUsage = useCallback(
    (action: GuestAction): UsageResult => {
      console.log("[Membership Context] 🔄 consumeUsage called:", {
        action,
        status,
        isMember: status === "member",
      });

      if (status === "member") {
        console.log(
          "[Membership Context] ⏭️ Skipping usage consumption (member)"
        );
        return {
          action,
          allowed: true,
          used: 0,
          remaining: Number.POSITIVE_INFINITY,
          limit: Number.POSITIVE_INFINITY,
        };
      }
      const usage = ensureFreshUsage(usageRef.current);
      usageRef.current = usage;
      const used = usage.counts[action] ?? 0;
      const limit = DEFAULT_LIMITS[action];

      console.log("[Membership Context] 📊 Current usage:", {
        action,
        used,
        limit,
        counts: usage.counts,
      });

      if (used >= limit) {
        console.log("[Membership Context] 🚫 Limit reached:", {
          action,
          used,
          limit,
        });
        setUsageSnapshot(buildUsageSnapshot(usage));
        return {
          action,
          allowed: false,
          used,
          remaining: 0,
          limit,
        };
      }
      const nextCounts = {
        ...usage.counts,
        [action]: used + 1,
      };
      const nextUsage = {
        ...usage,
        counts: nextCounts,
        lastReset: usage.lastReset,
      };
      usageRef.current = nextUsage;
      saveUsage(nextUsage);
      setUsageSnapshot(buildUsageSnapshot(nextUsage));

      console.log("[Membership Context] ✅ Usage consumed:", {
        action,
        newUsed: used + 1,
        limit,
        allCounts: nextCounts,
      });

      return {
        action,
        allowed: true,
        used: used + 1,
        remaining: Math.max(limit - (used + 1), 0),
        limit,
      };
    },
    [status]
  );

  const startCheckout = useCallback(() => {
    if (!stripeCheckoutUrl || typeof window === "undefined") {
      return false;
    }
    window.open(stripeCheckoutUrl, "_blank", "noopener,noreferrer");
    return true;
  }, [stripeCheckoutUrl]);

  const contextValue = useMemo<MembershipContextValue>(
    () => ({
      isMember: status === "member",
      isGuest: status !== "member",
      stripeCheckoutUrl,
      limits: DEFAULT_LIMITS,
      usage: usageSnapshot,
      evaluateUsage,
      consumeUsage,
      startCheckout,
      markMember,
      resetGuestUsage,
    }),
    [
      consumeUsage,
      evaluateUsage,
      markMember,
      resetGuestUsage,
      startCheckout,
      status,
      stripeCheckoutUrl,
      usageSnapshot,
    ]
  );

  return (
    <MembershipContext.Provider value={contextValue}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership(): MembershipContextValue {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return context;
}
