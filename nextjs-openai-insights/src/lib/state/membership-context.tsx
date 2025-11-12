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
  undefined,
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
    window.localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota failures
  }
}

function ensureFreshUsage(data: StoredUsageData): StoredUsageData {
  const shouldReset =
    data.version !== USAGE_VERSION ||
    Date.now() - data.lastReset > ONE_DAY_MS;
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
  const [status, setStatus] = useState<"guest" | "member">(() =>
    typeof window === "undefined" ? "guest" : getMembershipStatus(),
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

    const searchParams = new URLSearchParams(window.location.search);
    const hasSuccess =
      searchParams.get("membership") === "success" ||
      searchParams.get("checkout") === "success";
    if (hasSuccess) {
      startTransition(() => {
        markMember();
      });
      searchParams.delete("membership");
      searchParams.delete("checkout");
      const newSearch = searchParams.toString();
      const nextUrl = `${window.location.pathname}${
        newSearch ? `?${newSearch}` : ""
      }${window.location.hash || ""}`;
      window.history.replaceState(null, "", nextUrl);
    }
    setUsageSnapshot(buildUsageSnapshot(usageRef.current));
  }, [markMember]);

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
      setUsageSnapshot(buildUsageSnapshot(usage));
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
    [status],
  );

  const consumeUsage = useCallback(
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
      const used = usage.counts[action] ?? 0;
      const limit = DEFAULT_LIMITS[action];
      if (used >= limit) {
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
      return {
        action,
        allowed: true,
        used: used + 1,
        remaining: Math.max(limit - (used + 1), 0),
        limit,
      };
    },
    [status],
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
    ],
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


