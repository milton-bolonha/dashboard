"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowUp, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

/**
 * HeroSection compartilhado entre Landing e Create Workspace
 * @param {Object} props
 * @param {string} props.mode - "landing" ou "create-workspace"
 * @param {Function} props.onCreateWorkspace - Callback para criar workspace (modo create-workspace)
 * @param {string} props.styleMode - "default" ou "transparent" (estilo visual dos inputs)
 */
export default function HeroSection({
  mode = "landing",
  onCreateWorkspace,
  styleMode = "default", // ⭐ NOVO: Sistema de estilos
}) {
  const { isSignedIn, user } = useUser();
  const [userContext, setUserContext] = useState({
    company: "", // Empresa que o user representa
    companyWebsite: "", // Website da empresa que o user representa
    solution: "", // O que ele está vendendo
    researchTarget: "", // Nome da empresa a ser pesquisada
    researchWebsite: "", // Website da empresa a ser pesquisada (ÚLTIMO INPUT ESPECIAL)
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ DEBUG: Reset guest session
  const handleResetGuest = async () => {
    if (!confirm("Reset guest session?")) return;
    try {
      await fetch("/api/guest/reset", { method: "DELETE" });
      alert("Guest session resetada! Recarregue a página.");
      window.location.reload();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  // ⭐ NOVO: Estados de progresso dos inputs (5 inputs na ordem correta)
  const [inputStates, setInputStates] = useState({
    company: { focused: false, hasContent: false, isValid: false }, // 1º: Empresa que representa
    companyWebsite: { focused: false, hasContent: false, isValid: false }, // 2º: Website da empresa
    solution: { focused: false, hasContent: false, isValid: false }, // 3º: O que vende
    researchTarget: { focused: false, hasContent: false, isValid: false }, // 4º: Empresa a pesquisar
    researchWebsite: { focused: false, hasContent: false, isValid: false }, // 5º: Website da empresa a pesquisar (ESPECIAL)
  });

  // ⭐ NOVO: Detectar query params e preencher inputs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.has("rep") || params.has("solution") || params.has("target")) {
      const company = decodeURIComponent(params.get("rep") || "");
      const solution = decodeURIComponent(params.get("solution") || "");
      const researchTarget = decodeURIComponent(params.get("target") || "");

      setUserContext({
        company,
        companyWebsite: "",
        solution,
        researchTarget,
        researchWebsite: "",
      });

      // Atualizar estados dos inputs também
      const MIN_CHARS = 3;
      setInputStates({
        company: {
          focused: false,
          hasContent: company.trim().length > 0,
          isValid: company.trim().length >= MIN_CHARS,
        },
        companyWebsite: {
          focused: false,
          hasContent: false,
          isValid: false,
        },
        solution: {
          focused: false,
          hasContent: solution.trim().length > 0,
          isValid: solution.trim().length >= MIN_CHARS,
        },
        researchTarget: {
          focused: false,
          hasContent: researchTarget.trim().length > 0,
          isValid: researchTarget.trim().length >= MIN_CHARS,
        },
        researchWebsite: {
          focused: false,
          hasContent: false,
          isValid: false,
        },
      });

      console.log("✅ Query params detectados e inputs preenchidos");
    }
  }, []);

  // ⭐ REMOVIDO: Animação de palavras (agora é texto fixo "More Selling")

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

    // ⭐ NOVO: Validação especial para URLs
    if (field === "companyWebsite" || field === "researchWebsite") {
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

  // ⭐ NOVO: Handler para Enter ir para próximo input
  const handleKeyDown = (field, e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Mapear próximo campo (ORDEM CORRETA: company → companyWebsite → solution → researchTarget → researchWebsite)
      const fieldOrder = [
        "company",
        "companyWebsite",
        "solution",
        "researchTarget",
        "researchWebsite",
      ];
      const currentIndex = fieldOrder.indexOf(field);
      const nextField = fieldOrder[currentIndex + 1];

      // Se tem próximo campo e está habilitado, focar nele
      if (nextField && canEnableInput(nextField)) {
        const nextInput = document.querySelector(`input[name="${nextField}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      } else if (!nextField && allInputsValid) {
        // Se não tem próximo campo e todos válidos, submit
        handleAction();
      }
    }
  };

  const validateInputs = () => {
    if (!userContext.company.trim()) {
      return "Please tell us which company you represent";
    }
    if (!userContext.companyWebsite.trim()) {
      return "Please enter your company website";
    }
    if (!isValidUrl(userContext.companyWebsite.trim())) {
      return "Please enter a valid company website (e.g., www.microsoft.com)";
    }
    if (!userContext.solution.trim()) {
      return "Please describe what you're selling";
    }
    if (!userContext.researchTarget.trim()) {
      return "Please tell us which company you want to research";
    }
    if (!userContext.researchWebsite.trim()) {
      return "Please enter the company website to research";
    }
    if (!isValidUrl(userContext.researchWebsite.trim())) {
      return "Please enter a valid research website (e.g., www.tesla.com)";
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
          // ⭐ Usuário NÃO logado: GUEST MODE (criar guest workspace)
          console.log("🎉 Não logado! Criando guest workspace...");

          try {
            // Salvar contexto no localStorage (caso guest queira fazer signup depois)
            const contextToSave = {
              ...userContext,
              companyWebsite: normalizeUrl(userContext.companyWebsite),
              researchWebsite: normalizeUrl(userContext.researchWebsite),
            };
            localStorage.setItem(
              "onboarding_context",
              JSON.stringify(contextToSave)
            );

            // Criar guest workspace via API
            const response = await fetch("/api/guest/workspace", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                template_id: "template_1",
                context: contextToSave,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();

              // Se já existe guest session, redirecionar direto!
              if (errorData.redirect) {
                console.log("✅ Guest session já existe, redirecionando...");
                window.location.href = "/trial";
                return;
              }

              throw new Error(
                errorData.error || "Failed to create trial workspace"
              );
            }

            const data = await response.json();
            console.log("✅ Guest workspace criado!", data);

            // Redirecionar para trial dashboard
            window.location.href = "/trial";
          } catch (err) {
            console.error("❌ Erro ao criar guest workspace:", err);
            setError(err.message);
            setCreating(false);
          }
        }
      }
    } else {
      console.log("Landing mode: ready to sign up with context:", userContext);
      setCreating(false);
    }
  };

  // ⭐ NOVO: Verifica se pode habilitar próximo input (5 inputs na ordem correta)
  const canEnableInput = (inputName) => {
    if (inputName === "company") return true; // 1º sempre habilitado
    if (inputName === "companyWebsite") return inputStates.company.isValid; // 2º após company
    if (inputName === "solution") return inputStates.companyWebsite.isValid; // 3º após companyWebsite
    if (inputName === "researchTarget") return inputStates.solution.isValid; // 4º após solution
    if (inputName === "researchWebsite")
      return inputStates.researchTarget.isValid; // 5º após researchTarget (ESPECIAL)
    return false;
  };

  // ⭐ NOVO: Renderiza ícone apropriado baseado no estado
  const renderInputIcon = (inputName, isLastInput = false) => {
    const state = inputStates[inputName];
    const isEnabled = canEnableInput(inputName);

    // ============ MODO TRANSPARENT ============
    if (styleMode === "transparent") {
      // ÚLTIMO INPUT: Mantém seta verde pulsando (NUNCA some!)
      if (isLastInput && state.isValid && allInputsValid) {
        return (
          <button
            type="button"
            onClick={handleAction}
            disabled={creating}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

      // OUTROS INPUTS (não último): Some quando transparente (lápis vai inline)
      if (!isLastInput && state.isValid && !state.focused && !creating) {
        return null; // Some - lápis vai aparecer inline no texto
      }

      // INPUTS HABILITADOS (não transparentes ainda): Seta azul pra cima
      if (isEnabled) {
        return (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <ArrowUp className="w-4 h-4 text-white" />
          </div>
        );
      }

      // Input desabilitado: cinza com bolinha
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    // ============ MODO DEFAULT ============
    // Input desabilitado (cinza com bolinha)
    if (!isEnabled) {
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    // Input válido E não é o último (verde com checkmark)
    if (state.isValid && !isLastInput) {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      );
    }

    // Último input válido (verde com seta direita CLICÁVEL)
    if (state.isValid && isLastInput && allInputsValid) {
      return (
        <button
          type="button"
          onClick={handleAction}
          disabled={creating}
          className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <ArrowUp className="w-4 h-4 text-white" />
        </div>
      );
    }

    // Input focado ou com conteúdo mas não válido (azul com bolinha)
    if (state.focused || state.hasContent) {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    // Default: cinza com bolinha
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    );
  };

  // ⭐ NOVO: Verifica se todos inputs são válidos (5 inputs na ordem correta)
  const allInputsValid =
    inputStates.company.isValid &&
    inputStates.companyWebsite.isValid &&
    inputStates.solution.isValid &&
    inputStates.researchTarget.isValid &&
    inputStates.researchWebsite.isValid;

  // ⭐ NOVO: Helper para gerar classes dos inputs baseado no estilo
  const getInputClasses = (inputName) => {
    const isEnabled = canEnableInput(inputName);
    const state = inputStates[inputName];

    if (styleMode === "transparent") {
      // Estilo 2 (Transparent): Fundo fica transparente APÓS blur quando válido
      const isTransparent = state.isValid && !state.focused && !creating;

      // Mantém border-radius só pro layout, mas tira borda e shadow quando transparente
      // ⭐ NOVO: Mais padding-bottom para dar espaço ao placeholder persistente
      return `w-full px-6 pt-4 pb-8 pr-16 text-lg border rounded-xl outline-none ${
        isEnabled && !creating
          ? isTransparent
            ? "bg-transparent border-transparent shadow-none text-black" // ⭐ TOTALMENTE transparente
            : "bg-white border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          : "bg-gray-50 border-gray-200 shadow-sm cursor-not-allowed text-gray-400"
      }`;
    }

    // Estilo 1 (default): Com borda e fundo sempre (padding normal)
    return `w-full px-6 py-4 pr-16 text-lg border rounded-xl shadow-sm outline-none ${
      isEnabled && !creating
        ? "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        : "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
    }`;
  };

  // ⭐ NOVO: Helper para placeholder baseado no estilo
  const getPlaceholderText = (inputName) => {
    const placeholders = {
      company: "I am a sales rep at", // Empresa que representa
      companyWebsite: "My company website (e.g., www.microsoft.com)", // Website da empresa
      solution: "I am selling solutions for", // O que vende
      researchTarget: "I want to research this company", // Nome da empresa a pesquisar
      researchWebsite: "Company website to research (e.g., www.tesla.com)", // Website da empresa a pesquisar (ESPECIAL)
    };
    return placeholders[inputName] || "";
  };

  return (
    <section
      className="h-full flex items-center justify-center"
      style={{ backgroundColor: "#fcfcf9" }}
    >
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight mb-4 mt-60">
          Smarter Research. Faster Outreach. More Selling
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
            {/* Modo transparent: Mostra texto + lápis inline quando válido e sem foco */}
            {styleMode === "transparent" &&
            inputStates.company.isValid &&
            !inputStates.company.focused &&
            !creating ? (
              <div
                className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
                onClick={() => {
                  handleInputFocus("company");
                  document.querySelector('input[name="company"]')?.focus();
                }}
              >
                <span>{userContext.company}</span>
                <Image
                  src="/images/logo-mark.svg"
                  alt="Edit"
                  width={13}
                  height={13}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  name="company"
                  placeholder={
                    styleMode === "default" ? getPlaceholderText("company") : ""
                  }
                  value={userContext.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  onFocus={() => handleInputFocus("company")}
                  onBlur={() => handleInputBlur("company")}
                  onKeyDown={(e) => handleKeyDown("company", e)}
                  disabled={creating}
                  className={getInputClasses("company")}
                />
                {/* Placeholder persistente DENTRO do input (bottom) - sempre visível no transparent */}
                {styleMode === "transparent" && (
                  <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
                    {getPlaceholderText("company")}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("company", false)}
                </div>
              </div>
            )}
          </div>

          {/* Input 2: Company Website (habilita após company válido) */}
          <div className="max-w-2xl mx-auto relative">
            {/* Modo transparent: Mostra texto + lápis inline quando válido e sem foco */}
            {styleMode === "transparent" &&
            inputStates.companyWebsite.isValid &&
            !inputStates.companyWebsite.focused &&
            !creating ? (
              <div
                className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
                onClick={() => {
                  handleInputFocus("companyWebsite");
                  document
                    .querySelector('input[name="companyWebsite"]')
                    ?.focus();
                }}
              >
                <span>{userContext.companyWebsite}</span>
                <Image
                  src="/images/logo-mark.svg"
                  alt="Edit"
                  width={13}
                  height={13}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="url"
                  name="companyWebsite"
                  placeholder={
                    styleMode === "default"
                      ? getPlaceholderText("companyWebsite")
                      : ""
                  }
                  value={userContext.companyWebsite}
                  onChange={(e) =>
                    handleInputChange("companyWebsite", e.target.value)
                  }
                  onFocus={() => handleInputFocus("companyWebsite")}
                  onBlur={() => handleInputBlur("companyWebsite")}
                  onKeyDown={(e) => handleKeyDown("companyWebsite", e)}
                  disabled={!canEnableInput("companyWebsite") || creating}
                  className={getInputClasses("companyWebsite")}
                />
                {/* Placeholder persistente DENTRO do input (bottom) - sempre visível no transparent */}
                {styleMode === "transparent" && (
                  <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
                    {getPlaceholderText("companyWebsite")}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("companyWebsite", false)}
                </div>
              </div>
            )}
          </div>

          {/* Input 3: Solution (habilita após companyWebsite válido) */}
          <div className="max-w-2xl mx-auto relative">
            {/* Modo transparent: Mostra texto + lápis inline quando válido e sem foco */}
            {styleMode === "transparent" &&
            inputStates.solution.isValid &&
            !inputStates.solution.focused &&
            !creating ? (
              <div
                className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
                onClick={() => {
                  handleInputFocus("solution");
                  document.querySelector('input[name="solution"]')?.focus();
                }}
              >
                <span>{userContext.solution}</span>
                <Image
                  src="/images/logo-mark.svg"
                  alt="Edit"
                  width={13}
                  height={13}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  name="solution"
                  placeholder={
                    styleMode === "default"
                      ? getPlaceholderText("solution")
                      : ""
                  }
                  value={userContext.solution}
                  onChange={(e) =>
                    handleInputChange("solution", e.target.value)
                  }
                  onFocus={() => handleInputFocus("solution")}
                  onBlur={() => handleInputBlur("solution")}
                  onKeyDown={(e) => handleKeyDown("solution", e)}
                  disabled={!canEnableInput("solution") || creating}
                  className={getInputClasses("solution")}
                />
                {/* Placeholder persistente DENTRO do input (bottom) - sempre visível no transparent */}
                {styleMode === "transparent" && (
                  <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
                    {getPlaceholderText("solution")}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("solution", false)}
                </div>
              </div>
            )}
          </div>

          {/* Input 4: Research Target (habilita após solution válido) */}
          <div className="max-w-2xl mx-auto relative">
            {/* Modo transparent: Mostra texto + lápis inline quando válido e sem foco */}
            {styleMode === "transparent" &&
            inputStates.researchTarget.isValid &&
            !inputStates.researchTarget.focused &&
            !creating ? (
              <div className="relative">
                <div
                  className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
                  onClick={() => {
                    handleInputFocus("researchTarget");
                    document
                      .querySelector('input[name="researchTarget"]')
                      ?.focus();
                  }}
                >
                  <span>{userContext.researchTarget}</span>
                  <Image
                    src="/images/logo-mark.svg"
                    alt="Edit"
                    width={13}
                    height={13}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  />
                </div>
                {/* Seta verde continua visível mesmo quando transparente */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("researchTarget", false)}
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  name="researchTarget"
                  placeholder={
                    styleMode === "default"
                      ? getPlaceholderText("researchTarget")
                      : ""
                  }
                  value={userContext.researchTarget}
                  onChange={(e) =>
                    handleInputChange("researchTarget", e.target.value)
                  }
                  onFocus={() => handleInputFocus("researchTarget")}
                  onBlur={() => handleInputBlur("researchTarget")}
                  onKeyDown={(e) => handleKeyDown("researchTarget", e)}
                  disabled={!canEnableInput("researchTarget") || creating}
                  className={getInputClasses("researchTarget")}
                />
                {/* Placeholder persistente DENTRO do input (bottom) - sempre visível no transparent */}
                {styleMode === "transparent" && (
                  <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
                    {getPlaceholderText("researchTarget")}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("researchTarget", false)}
                </div>
              </div>
            )}
          </div>

          {/* Input 5: Research Website (habilita após researchTarget válido) - ÚLTIMO INPUT ESPECIAL */}
          <div className="max-w-2xl mx-auto relative">
            {/* Modo transparent: Mostra texto + lápis inline quando válido e sem foco */}
            {styleMode === "transparent" &&
            inputStates.researchWebsite.isValid &&
            !inputStates.researchWebsite.focused &&
            !creating ? (
              <div className="relative">
                <div
                  className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
                  onClick={() => {
                    handleInputFocus("researchWebsite");
                    document
                      .querySelector('input[name="researchWebsite"]')
                      ?.focus();
                  }}
                >
                  <span>{userContext.researchWebsite}</span>
                  <Image
                    src="/images/logo-mark.svg"
                    alt="Edit"
                    width={13}
                    height={13}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  />
                </div>
                {/* Seta verde continua visível mesmo quando transparente */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("researchWebsite", true)}
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="url"
                  name="researchWebsite"
                  placeholder={
                    styleMode === "default"
                      ? getPlaceholderText("researchWebsite")
                      : ""
                  }
                  value={userContext.researchWebsite}
                  onChange={(e) =>
                    handleInputChange("researchWebsite", e.target.value)
                  }
                  onFocus={() => handleInputFocus("researchWebsite")}
                  onBlur={() => handleInputBlur("researchWebsite")}
                  onKeyDown={(e) => handleKeyDown("researchWebsite", e)}
                  disabled={!canEnableInput("researchWebsite") || creating}
                  className={getInputClasses("researchWebsite")}
                />
                {/* Placeholder persistente DENTRO do input (bottom) - sempre visível no transparent */}
                {styleMode === "transparent" && (
                  <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
                    {getPlaceholderText("researchWebsite")}
                  </div>
                )}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {renderInputIcon("researchWebsite", true)}
                </div>
              </div>
            )}
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

          {/* ⭐ DEBUG: Reset Button (remover depois!) */}
          <button
            onClick={handleResetGuest}
            className="mt-4 text-xs text-red-600 hover:text-red-700 underline"
          >
            🗑️ Reset Guest Session (DEBUG)
          </button>
        </div>
      </div>
    </section>
  );
}
