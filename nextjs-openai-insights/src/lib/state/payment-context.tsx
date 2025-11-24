"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type PaymentStatus =
  | "pending"
  | "verifying"
  | "paid"
  | "failed"
  | "onboarding";

export interface PaymentContextValue {
  status: PaymentStatus;
  email?: string;
  plan?: "FREE" | "PRO" | "PRO_PLUS";
  sessionId?: string;
  verifyPayment: (sessionId?: string, email?: string) => Promise<boolean>;
  completePayment: (sessionId?: string, email?: string) => Promise<boolean>;
  clearStatus: () => void;
}

const PaymentContext = createContext<PaymentContextValue | undefined>(
  undefined
);

const POLLING_INTERVAL = 30000; // 30 segundos
const MAX_POLLING_ATTEMPTS = 10; // Máximo 5 minutos

export function PaymentProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [email, setEmail] = useState<string | undefined>();
  const [plan, setPlan] = useState<"FREE" | "PRO" | "PRO_PLUS" | undefined>();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Verificar pagamento
  const verifyPayment = useCallback(
    async (sessionIdParam?: string, emailParam?: string): Promise<boolean> => {
      const sid = sessionIdParam || sessionId;
      const eml = emailParam || email;

      if (!sid && !eml) {
        console.warn("[Payment Context] ⚠️ No session_id or email provided");
        return false;
      }

      setStatus("verifying");

      try {
        const params = new URLSearchParams();
        if (sid) params.set("session_id", sid);
        if (eml) params.set("email", eml);

        const response = await fetch(
          `/api/payment/verify?${params.toString()}`
        );
        const result = await response.json();

        if (result.paid) {
          setStatus("paid");
          setEmail(result.email);
          setPlan(result.plan);
          if (result.sessionId) setSessionId(result.sessionId);
          attemptsRef.current = 0; // Reset attempts

          // Parar polling se estava ativo
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          console.log("[Payment Context] ✅ Payment verified:", result);
          return true;
        } else {
          setStatus("failed");
          console.log(
            "[Payment Context] ❌ Payment not verified:",
            result.error
          );
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          "[Payment Context] ❌ Error verifying payment:",
          errorMessage
        );
        setStatus("failed");
        return false;
      }
    },
    [sessionId, email]
  );

  // Completar pagamento
  const completePayment = useCallback(
    async (sessionIdParam?: string, emailParam?: string): Promise<boolean> => {
      const sid = sessionIdParam || sessionId;
      const eml = emailParam || email;

      if (!sid && !eml) {
        console.warn("[Payment Context] ⚠️ No session_id or email provided");
        return false;
      }

      try {
        const response = await fetch("/api/payment/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid,
            email: eml,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setEmail(result.email);
          setPlan(result.plan);

          if (result.needsOnboarding) {
            setStatus("onboarding");
            // Redirecionar para onboarding
            router.push("/onboarding");
          } else {
            setStatus("paid");
            // Redirecionar para admin
            router.push("/admin");
          }

          console.log("[Payment Context] ✅ Payment completed:", result);
          return true;
        } else {
          setStatus("failed");
          console.error(
            "[Payment Context] ❌ Payment completion failed:",
            result.error
          );
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          "[Payment Context] ❌ Error completing payment:",
          errorMessage
        );
        setStatus("failed");
        return false;
      }
    },
    [sessionId, email, router]
  );

  // Limpar status
  const clearStatus = useCallback(() => {
    setStatus("pending");
    setEmail(undefined);
    setPlan(undefined);
    setSessionId(undefined);
    attemptsRef.current = 0;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Verificar URL params ao montar
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = searchParams.get("checkout") === "success";
    const sessionIdParam = searchParams.get("session_id");

    if (checkoutSuccess && sessionIdParam) {
      console.log(
        "[Payment Context] 🔍 Detected checkout success, verifying payment..."
      );
      setSessionId(sessionIdParam);
      verifyPayment(sessionIdParam);
    }
  }, [verifyPayment]);

  // Polling quando em estado pending
  useEffect(() => {
    if (status !== "pending" || !sessionId) return;
    if (attemptsRef.current >= MAX_POLLING_ATTEMPTS) {
      console.log("[Payment Context] ⏰ Max polling attempts reached");
      return;
    }

    // Iniciar polling
    pollingRef.current = setInterval(() => {
      attemptsRef.current++;
      console.log(
        `[Payment Context] 🔄 Polling attempt ${attemptsRef.current}/${MAX_POLLING_ATTEMPTS}`
      );
      verifyPayment(sessionId);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [status, sessionId, verifyPayment]);

  const value: PaymentContextValue = {
    status,
    email,
    plan,
    sessionId,
    verifyPayment,
    completePayment,
    clearStatus,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}
