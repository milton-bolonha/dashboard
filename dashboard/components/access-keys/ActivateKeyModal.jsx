"use client";

import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@clerk/nextjs";

const IconKey = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-2H5v-2H4v-2H3v-1a1 1 0 011-1h1v-1H4a1 1 0 01-1-1V7a1 1 0 011-1h1V5h1V4h1V3a3 3 0 016 0v1h1v1h1v1h1v1a1 1 0 011 1v3.432A6 6 0 0118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z"
      clipRule="evenodd"
    />
  </svg>
);

export default function ActivateKeyModal({ isOpen, onClose, onSuccess }) {
  const { currentWorkspace } = useWorkspace();
  const { session } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError("Digite o código da chave");
      return;
    }

    if (!session) {
      setError("Sua sessão não foi encontrada. Tente recarregar a página.");
      return;
    }

    console.log("\n[CLIENT DEBUG] === INICIANDO ATIVAÇÃO DA CHAVE ===");
    console.log("[CLIENT DEBUG] Informações da sessão:", {
      sessionId: session.id,
      userId: session.user?.id,
      hasSession: !!session,
      sessionStatus: session.status,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
    });

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("[CLIENT DEBUG] Obtendo token...");
      const token = await session.getToken();
      console.log("[CLIENT DEBUG] Token obtido:", {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + "..." : "null",
        tokenLength: token ? token.length : 0,
      });

      const requestBody = {
        code: code.trim().toLowerCase(),
        workspaceId: currentWorkspace._id,
      };

      console.log("[CLIENT DEBUG] Preparando requisição:", {
        url: "/api/access-keys/activate",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            token ? "[TOKEN_PRESENTE]" : "[TOKEN_AUSENTE]"
          }`,
        },
        body: requestBody,
      });

      console.log("[CLIENT DEBUG] Enviando requisição...");
      const response = await fetch("/api/access-keys/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[CLIENT DEBUG] Resposta recebida:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const result = await response.json();
      console.log("[CLIENT DEBUG] Resultado parseado:", result);

      if (result.success) {
        console.log("[CLIENT DEBUG] Sucesso na ativação da chave");
        setSuccess(result.message);
        setCode("");
        onSuccess?.(result);
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2000);
      } else {
        console.log("[CLIENT DEBUG] Erro na ativação:", result.error);
        setError(result.error || "Erro ao ativar chave");
      }
    } catch (error) {
      console.error("[CLIENT DEBUG] Erro CRÍTICO:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\s/g, "");
    setCode(value);
    if (error) setError("");
  };

  const handleClose = () => {
    if (!loading) {
      setCode("");
      setError("");
      setSuccess("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ativar Chave de Acesso</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Código da Chave
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="Ex: DS-SA-KEY-..."
              className="w-full px-3 py-2 border rounded-lg text-center font-mono text-lg tracking-wider"
              disabled={loading || success}
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Digite o código exatamente como recebido
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">
              ℹ️ Sobre as Chaves de Acesso
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Chaves podem liberar planos, features ou créditos</li>
              <li>• Algumas chaves têm limite de uso ou expiração</li>
              <li>
                • Verificaremos se você tem permissão para usar esta chave
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={loading}
            >
              {success ? "Fechar" : "Cancelar"}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={loading || !code.trim() || success}
            >
              {loading ? "Ativando..." : success ? "Sucesso!" : "Ativar Chave"}
            </button>
          </div>
        </form>

        {code && !success && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Código formatado:</p>
            <p className="font-mono text-lg font-bold text-center text-blue-600">
              {code}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivateKeyButton({ className = "" }) {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = (result) => {
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold cursor-pointer ${className}`}
      >
        <IconKey />
        Ativar Chave de Acesso
      </button>

      <ActivateKeyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
