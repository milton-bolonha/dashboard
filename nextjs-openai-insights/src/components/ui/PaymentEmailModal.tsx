"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { usePayment } from "@/lib/state/payment-context";

interface PaymentEmailModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaymentEmailModal({ open, onClose }: PaymentEmailModalProps) {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyPayment, completePayment } = usePayment();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Por favor, informe seu email");
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, informe um email válido");
      return;
    }

    setIsVerifying(true);

    try {
      // Verificar pagamento por email
      const verified = await verifyPayment(undefined, email);

      if (verified) {
        // Completar pagamento
        await completePayment(undefined, email);
        // O PaymentContext vai redirecionar automaticamente
      } else {
        setError(
          "Pagamento não encontrado para este email. Verifique se o email está correto ou aguarde alguns minutos."
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao verificar pagamento";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Confirmar pagamento
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Informe o email usado no pagamento para confirmar sua compra
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="payment-email"
              className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Mail className="h-4 w-4" />
              Email usado no pagamento
            </label>
            <input
              id="payment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isVerifying}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-black focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="seu@email.com"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || !email.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar pagamento"
              )}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          💡 Dica: Use o mesmo email que você informou no checkout do Stripe
        </p>
      </div>
    </div>
  );
}
