"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowUp, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";

/**
 * HeroSection compartilhado entre Landing e Create Workspace
 * @param {Object} props
 * @param {string} props.mode - "landing" ou "create-workspace"
 * @param {Function} props.onCreateWorkspace - Callback para criar workspace (modo create-workspace)
 */
export default function HeroSection({ mode = "landing", onCreateWorkspace }) {
  const { isSignedIn, user } = useUser();
  const words = ["Duplicate", "Triplicate", "Multiple"];
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [userContext, setUserContext] = useState({
    company: "",
    companyUrl: "", // ⭐ NOVO: URL da empresa do vendedor
    solution: "",
    research: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ NOVO: Estados de progresso dos inputs (4 inputs agora)
  const [inputStates, setInputStates] = useState({
    company: { focused: false, hasContent: false, isValid: false },
    companyUrl: { focused: false, hasContent: false, isValid: false }, // ⭐ NOVO
    solution: { focused: false, hasContent: false, isValid: false },
    research: { focused: false, hasContent: false, isValid: false },
  });

  // ⭐ NOVO: Detectar query params e preencher inputs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.has("rep") || params.has("solution") || params.has("target")) {
      const company = decodeURIComponent(params.get("rep") || "");
      const solution = decodeURIComponent(params.get("solution") || "");
      const research = decodeURIComponent(params.get("target") || "");

      setUserContext({
        company,
        solution,
        research,
      });

      // Atualizar estados dos inputs também
      const MIN_CHARS = 3;
      setInputStates({
        company: {
          focused: false,
          hasContent: company.trim().length > 0,
          isValid: company.trim().length >= MIN_CHARS,
        },
        solution: {
          focused: false,
          hasContent: solution.trim().length > 0,
          isValid: solution.trim().length >= MIN_CHARS,
        },
        research: {
          focused: false,
          hasContent: research.trim().length > 0,
          isValid: research.trim().length >= MIN_CHARS,
        },
      });

      console.log("✅ Query params detectados e inputs preenchidos");
    }
  }, []);

  // Rotacionar palavras dinâmicas
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // ⭐ NOVO: Validação de URL
  const isValidUrl = (url) => {
    // Aceita: tesla.com, www.tesla.com, https://tesla.com
    return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+/.test(url);
  };

  // ⭐ NOVO: Normalizar URL para salvar (remove protocolo, www, barra final)
  const normalizeUrl = (url) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase();
  };

  const handleInputChange = (field, value) => {
    setUserContext((prev) => ({
      ...prev,
      [field]: value,
    }));

    // ⭐ NOVO: Atualizar estado do input
    const MIN_CHARS = 3;
    let isValid = value.trim().length >= MIN_CHARS;

    // ⭐ NOVO: Validação especial para URL
    if (field === "companyUrl") {
      isValid = value.trim().length > 0 && isValidUrl(value.trim());
    }

    setInputStates((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        hasContent: value.trim().length > 0,
        isValid: isValid,
      },
    }));
  };

  const handleInputFocus = (field) => {
    setInputStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], focused: true },
    }));
  };

  const handleInputBlur = (field) => {
    setInputStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], focused: false },
    }));
  };

  const validateInputs = () => {
    if (!userContext.company.trim()) {
      return "Please tell us which company you represent";
    }
    if (!userContext.companyUrl.trim()) {
      return "Please enter your company's website";
    }
    if (!isValidUrl(userContext.companyUrl.trim())) {
      return "Please enter a valid URL (e.g., tesla.com)";
    }
    if (!userContext.solution.trim()) {
      return "Please describe what you're selling";
    }
    if (!userContext.research.trim()) {
      return "Please tell us what you want to research";
    }
    return null;
  };

  const handleAction = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    setError(null);

    if (mode === "create-workspace" && onCreateWorkspace) {
      try {
        await onCreateWorkspace(userContext);
      } catch (err) {
        setError(err.message);
        setCreating(false);
      }
      // Não fazer finally aqui - deixa loading enquanto redireciona
    } else if (mode === "landing") {
      // ⭐ Landing mode
      if (typeof window !== "undefined") {
        // Se usuário JÁ está logado, salvar contexto e redirecionar
        // (o DashboardProviders vai auto-criar e selecionar o workspace)
        if (isSignedIn && user) {
          console.log(
            "✅ Usuário logado! Salvando contexto para auto-criação..."
          );
          localStorage.setItem(
            "onboarding_context",
            JSON.stringify(userContext)
          );
          window.location.href = "/dashboard?onboarding=true";
        } else {
          // Usuário NÃO logado - salvar contexto e redirecionar para sign up
          console.log("💾 Salvando contexto de onboarding...");
          // ⭐ NOVO: Normalizar URL antes de salvar
          const contextToSave = {
            ...userContext,
            companyUrl: normalizeUrl(userContext.companyUrl),
          };
          localStorage.setItem(
            "onboarding_context",
            JSON.stringify(contextToSave)
          );

          console.log("🔄 Redirecionando para sign up...");
          window.location.href = "/sign-up?redirect=/dashboard&onboarding=true";
        }
      }
    } else {
      console.log("Landing mode: ready to sign up with context:", userContext);
      setCreating(false);
    }
  };

  // ⭐ NOVO: Verifica se pode habilitar próximo input (4 inputs agora)
  const canEnableInput = (inputName) => {
    if (inputName === "company") return true; // Primeiro sempre habilitado
    if (inputName === "companyUrl") return inputStates.company.isValid; // ⭐ NOVO
    if (inputName === "solution") return inputStates.companyUrl.isValid; // ⭐ MUDOU
    if (inputName === "research")
      return inputStates.companyUrl.isValid && inputStates.solution.isValid; // ⭐ MUDOU
    return false;
  };

  // ⭐ NOVO: Renderiza ícone apropriado baseado no estado
  const renderInputIcon = (inputName, isLastInput = false) => {
    const state = inputStates[inputName];
    const isEnabled = canEnableInput(inputName);

    // Input desabilitado (cinza com bolinha)
    if (!isEnabled) {
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center transition-all duration-300">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    // ⭐ NOVO: Input válido E não é o último (verde com checkmark)
    if (state.isValid && !isLastInput) {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center transition-all duration-300">
          <Check className="w-4 h-4 text-white" />
        </div>
      );
    }

    // ⭐ NOVO: Último input válido (verde com seta direita CLICÁVEL)
    if (state.isValid && isLastInput && allInputsValid) {
      return (
        <button
          type="button"
          onClick={handleAction}
          disabled={creating}
          className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            animation: creating
              ? "none"
              : "bouncePulse 4s ease-in-out infinite",
          }}
        >
          {creating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <ArrowRight className="w-4 h-4 text-white" />
          )}
        </button>
      );
    }

    // Input com conteúdo válido mas ainda faltam outros (azul com seta cima)
    if (state.isValid && isLastInput && !allInputsValid) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300">
          <ArrowUp className="w-4 h-4 text-white" />
        </div>
      );
    }

    // Input focado ou com conteúdo mas não válido (azul com bolinha)
    if (state.focused || state.hasContent) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    // Default: cinza com bolinha
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center transition-all duration-300">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    );
  };

  // ⭐ NOVO: Verifica se todos inputs são válidos (4 inputs agora)
  const allInputsValid =
    inputStates.company.isValid &&
    inputStates.companyUrl.isValid && // ⭐ NOVO
    inputStates.solution.isValid &&
    inputStates.research.isValid;

  return (
    <section className="h-full bg-white flex items-center justify-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes bouncePulse {
            0% {
              transform: translateY(0);
            }
            5% {
              transform: translateY(-8px);
            }
            10% {
              transform: translateY(0);
            }
            15% {
              transform: translateY(-4px);
            }
            20% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(0);
            }
          }
        `,
        }}
      />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-4 text-center">
        {/* Título Principal */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight mb-4 mt-0">
          Smarter Research. Faster Outreach.{" "}
          <span className="text-black">{currentWord}</span> Selling
        </h1>

        {/* Subtítulo */}
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          WebApp is your personal research assistant that works even when you
          sleep
        </p>

        {/* Inputs de Contexto com Ícones Progressivos */}
        <div className="space-y-4 mb-8">
          {/* Input 1: Company (sempre habilitado) */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="I am a sales rep at"
              value={userContext.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
              onFocus={() => handleInputFocus("company")}
              onBlur={() => handleInputBlur("company")}
              disabled={creating}
              className={`w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300 ${
                creating ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {renderInputIcon("company", false)}
            </div>
          </div>

          {/* Input 2: Company URL (habilita após company válido) ⭐ NOVO */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="url"
              placeholder="Enter your company's website (e.g., tesla.com)"
              value={userContext.companyUrl}
              onChange={(e) => handleInputChange("companyUrl", e.target.value)}
              onFocus={() => handleInputFocus("companyUrl")}
              onBlur={() => handleInputBlur("companyUrl")}
              disabled={!canEnableInput("companyUrl") || creating}
              className={`w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm outline-none transition-all duration-300 ${
                canEnableInput("companyUrl") && !creating
                  ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
              }`}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {renderInputIcon("companyUrl", false)}
            </div>
          </div>

          {/* Input 3: Solution (habilita após company URL válido) */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="I am selling solutions for"
              value={userContext.solution}
              onChange={(e) => handleInputChange("solution", e.target.value)}
              onFocus={() => handleInputFocus("solution")}
              onBlur={() => handleInputBlur("solution")}
              disabled={!canEnableInput("solution") || creating}
              className={`w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm outline-none transition-all duration-300 ${
                canEnableInput("solution") && !creating
                  ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
              }`}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {renderInputIcon("solution", false)}
            </div>
          </div>

          {/* Input 4: Research (habilita após solution válido) */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="I want to conduct research on"
              value={userContext.research}
              onChange={(e) => handleInputChange("research", e.target.value)}
              onFocus={() => handleInputFocus("research")}
              onBlur={() => handleInputBlur("research")}
              disabled={!canEnableInput("research") || creating}
              className={`w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm outline-none transition-all duration-300 ${
                canEnableInput("research") && !creating
                  ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  : "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
              }`}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {renderInputIcon("research", true)}
            </div>
          </div>
        </div>

        {/* Instrução */}
        <p className="text-lg text-black mb-6">
          Ask WebApp research your whole territory for you
        </p>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Botões CTA - Sempre Azuis (alternativa visual) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAction}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Connect CRM</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleAction}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Upload CSV</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
