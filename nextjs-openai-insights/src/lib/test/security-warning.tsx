"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Componente de aviso de segurança para o dashboard de testes
 */
export function SecurityWarning() {
  return (
    <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Aviso de Segurança</h3>
          <div className="text-xs text-yellow-200/80 space-y-1">
            <p>
              <strong>Este dashboard é apenas para DESENVOLVIMENTO/TESTE.</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Dados sensíveis (tokens, senhas, API keys) são automaticamente <strong>redatados</strong> nos logs</li>
              <li>Headers sensíveis não são capturados</li>
              <li>Body de webhooks e endpoints de autenticação não são capturados</li>
              <li>Em produção, o logging deve ser DESABILITADO</li>
            </ul>
            <p className="mt-2">
              <strong>Status:</strong> Logging{" "}
              {typeof window !== "undefined" && localStorage.getItem("insights_test_logging_enabled") === "true"
                ? "✅ HABILITADO (desenvolvimento)"
                : process.env.NODE_ENV === "development"
                ? "✅ HABILITADO (modo desenvolvimento)"
                : "❌ DESABILITADO"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

