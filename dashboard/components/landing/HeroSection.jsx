"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Globe,
  Zap,
  Target,
  Search,
  X,
  User,
  Bot,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

// Configuração das tags para interface de chat
const tagConfig = {
  company: {
    label: "Company",
    icon: Briefcase,
    placeholder: "I am a sales rep at...",
    color: { border: "#3B82F6", bg: "#EFF6FF" }, // Azul
    tooltip: "Which company do you represent?",
  },
  companyWebsite: {
    label: "Company Website",
    icon: Globe,
    placeholder: "www.yourcompany.com",
    color: { border: "#10B981", bg: "#ECFDF5" }, // Verde
    tooltip: "Your company's website URL",
  },
  solution: {
    label: "Solution",
    icon: Zap,
    placeholder: "I am selling solutions for...",
    color: { border: "#8B5CF6", bg: "#F5F3FF" }, // Roxo
    tooltip: "What are you selling?",
  },
  researchTarget: {
    label: "Research Target",
    icon: Target,
    placeholder: "Company name to research",
    color: { border: "#F59E0B", bg: "#FEF3C7" }, // Laranja
    tooltip: "Which company do you want to research?",
  },
  researchWebsite: {
    label: "Target Website",
    icon: Search,
    placeholder: "www.targetcompany.com",
    color: { border: "#EF4444", bg: "#FEE2E2" }, // Vermelho
    tooltip: "Target company's website URL",
  },
};

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

  // ⭐ NOVO: Estados para interface de chat
  const [selectedTag, setSelectedTag] = useState("company"); // Tag atualmente ativa
  const [chatInputValue, setChatInputValue] = useState(""); // Valor atual do input de chat
  const [completedTags, setCompletedTags] = useState([]); // Tags já preenchidas
  const [carouselScroll, setCarouselScroll] = useState(0); // Posição do scroll do carrossel
  const [chatMessages, setChatMessages] = useState([]); // Mensagens do chat
  const [showInitialMessages, setShowInitialMessages] = useState(false); // Controla animação inicial
  const [isBotTyping, setIsBotTyping] = useState(false); // Bot digitando
  const [currentBotQuestion, setCurrentBotQuestion] = useState(null); // Pergunta atual do bot

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

  // Perguntas do bot para cada tag
  const botQuestions = {
    company: "What's the name of your company?",
    companyWebsite: "What's your company website?",
    solution: "What solutions are you selling?",
    researchTarget: "Which company do you want to research?",
    researchWebsite: "What's the target company's website?",
  };

  // ⭐ NOVO: Funções para gerenciar tags e carrossel
  const handleTagSelect = (tagName) => {
    setSelectedTag(tagName);
    setChatInputValue(userContext[tagName] || "");
    setError(null); // Limpar erro ao trocar de tag

    // Controle inteligente: só mostra pergunta se não for a mesma tag ou se não tiver pergunta atual
    if (currentBotQuestion !== tagName) {
      setCurrentBotQuestion(tagName);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: `Great! I've selected the ${tagConfig[tagName].label} tag. ${botQuestions[tagName]}`,
            isUser: false,
          },
        ]);
      }, 1500);
    }
  };

  const handleTagDeselect = (tagName) => {
    // Desselecionar apenas se for a tag ativa
    if (selectedTag === tagName) {
      setSelectedTag(null);
      setChatInputValue("");
      setError(null);
    }
  };

  const handleChatSubmit = () => {
    if (!selectedTag || !chatInputValue.trim()) return;

    const trimmedValue = chatInputValue.trim();

    // ⭐ Validação especial para URLs (mantém lógica atual)
    if (selectedTag === "companyWebsite" || selectedTag === "researchWebsite") {
      if (!isValidUrl(trimmedValue)) {
        setError(`Please enter a valid website URL (e.g., www.example.com)`);
        return;
      }
    }

    // ⭐ Validação de tamanho mínimo (mantém lógica atual)
    if (trimmedValue.length < 3) {
      setError(`Please enter at least 3 characters`);
      return;
    }

    // Limpar erro se passou na validação
    setError(null);

    // Adicionar resposta do usuário ao chat
    setChatMessages((prev) => [
      ...prev,
      {
        text: trimmedValue,
        isUser: true,
      },
    ]);

    // Salvar valor no contexto
    setUserContext((prev) => ({
      ...prev,
      [selectedTag]: trimmedValue,
    }));

    // Adicionar à lista de completadas
    if (!completedTags.includes(selectedTag)) {
      setCompletedTags((prev) => [...prev, selectedTag]);
    }

    // Adicionar confirmação do bot
    setTimeout(() => {
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: "Perfect! Now tap another tag to continue filling out your research details.",
            isUser: false,
          },
        ]);
      }, 1000);
    }, 500);

    // Limpar chat e desselecionar tag
    setChatInputValue("");
    setSelectedTag(null);
    setCurrentBotQuestion(null);
  };

  const handleCarouselScroll = (direction) => {
    const scrollAmount = 200;
    const newScroll =
      direction === "left"
        ? Math.max(0, carouselScroll - scrollAmount)
        : carouselScroll + scrollAmount;
    setCarouselScroll(newScroll);
  };

  // Verificar se todas as tags estão preenchidas
  const allTagsCompleted = Object.keys(tagConfig).every(
    (tag) => userContext[tag] && userContext[tag].trim().length > 0
  );

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

  // Animação sequencial das mensagens iniciais
  useEffect(() => {
    // 1. Bot pergunta com loading
    setIsBotTyping(true);

    const timer1 = setTimeout(() => {
      setIsBotTyping(false);
      setChatMessages([
        { text: "Who would you like to research?", isUser: false },
      ]);
    }, 2000);

    // 2. User responde (sem loading, aparece direto)
    const timer2 = setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          text: "I would like to do some research to sell better",
          isUser: true,
        },
      ]);
    }, 3500);

    // 3. Bot sugere usar tags com loading
    const timer3 = setTimeout(() => {
      setIsBotTyping(true);
    }, 5000);

    const timer4 = setTimeout(() => {
      setIsBotTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          text: "Tap a tag below to get started with your research!",
          isUser: false,
        },
      ]);
    }, 6500);

    // 4. Liberar interação e focar no input
    const timer5 = setTimeout(() => {
      setShowInitialMessages(true);
      // Focar no input já que company está pré-selecionada
      setTimeout(() => {
        const chatInput = document.getElementById("chat-input");
        if (chatInput) {
          chatInput.focus();
        }
      }, 100);
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  // Mostrar pergunta da tag selecionada (após animação inicial)
  useEffect(() => {
    if (selectedTag && !currentBotQuestion && showInitialMessages) {
      setCurrentBotQuestion(selectedTag);
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: botQuestions[selectedTag],
            isUser: false,
          },
        ]);
      }, 1500);
    }
  }, [selectedTag, currentBotQuestion, showInitialMessages]);

  // Scroll automático do chat
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      // Scroll imediato e agressivo
      const scrollToEnd = () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        // Forçar novamente após um frame
        requestAnimationFrame(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      };

      scrollToEnd();
      // Tentar novamente após um pequeno delay
      setTimeout(scrollToEnd, 100);
    }
  }, [chatMessages, isBotTyping]);

  // Scroll automático quando digitar no input
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer && chatInputValue) {
      const scrollToEnd = () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        requestAnimationFrame(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      };
      scrollToEnd();
    }
  }, [chatInputValue]);

  // Função para scroll imediato
  const scrollToBottom = () => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      const scrollToEnd = () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        requestAnimationFrame(() => {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        });
      };
      scrollToEnd();
    }
  };

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
            // Gerar guest_id único
            const guestId = `guest_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            // Definir cookie guest_id
            document.cookie = `guest_id=${guestId}; Path=/; Max-Age=86400`; // 24 horas

            console.log("🍪 Guest ID definido:", guestId);

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

  // ⭐ NOVO: Componente TagCarousel
  const TagCarousel = () => {
    // Mostrar apenas tags que NÃO estão preenchidas
    const availableTags = Object.keys(tagConfig).filter(
      (tag) => !completedTags.includes(tag)
    );

    const scrollContainer = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Verificar se precisa de scroll
    const checkScroll = () => {
      if (scrollContainer.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainer.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };

    // Scroll para esquerda
    const scrollLeft = () => {
      if (scrollContainer.current) {
        scrollContainer.current.scrollBy({ left: -200, behavior: "smooth" });
      }
    };

    // Scroll para direita
    const scrollRight = () => {
      if (scrollContainer.current) {
        scrollContainer.current.scrollBy({ left: 200, behavior: "smooth" });
      }
    };

    // Verificar scroll ao carregar e redimensionar
    useEffect(() => {
      checkScroll();
      const handleResize = () => checkScroll();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [availableTags]);

    return (
      <div className="max-w-4xl mx-auto py-2 relative">
        {/* Seta esquerda */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Container das tags com scroll horizontal */}
        <div
          ref={scrollContainer}
          className="flex gap-2 overflow-x-hidden px-8 justify-center"
          onScroll={checkScroll}
        >
          {availableTags.map((tagName) => {
            const config = tagConfig[tagName];
            const IconComponent = config.icon;
            const isCompleted = completedTags.includes(tagName);

            return (
              <div key={tagName} className="flex-shrink-0">
                <button
                  onClick={() => handleTagSelect(tagName)}
                  className={`
                          flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 transition-all duration-200 h-8
                          hover:shadow-md
                          ${
                            isCompleted
                              ? "opacity-50 cursor-not-allowed bg-gray-100"
                              : selectedTag === tagName
                              ? "bg-gray-100 cursor-pointer"
                              : "bg-white cursor-pointer hover:border-gray-300"
                          }
                        `}
                  disabled={isCompleted}
                  title={config.tooltip}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.color.bg }}
                  >
                    <IconComponent
                      className="w-3 h-3"
                      style={{ color: config.color.border }}
                    />
                  </div>
                  <span className="font-medium text-sm text-gray-700">
                    {config.label}
                  </span>
                  {!isCompleted && (
                    <span className="text-sm font-bold text-gray-500">+</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Seta direita */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Degradê esquerdo */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-5"
            style={{
              background: "linear-gradient(to right, #fcfcf9, transparent)",
            }}
          />
        )}

        {/* Degradê direito */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-5"
            style={{
              background: "linear-gradient(to left, #fcfcf9, transparent)",
            }}
          />
        )}
      </div>
    );
  };

  // ⭐ NOVO: Componente ChatInterface
  const ChatInterface = () => {
    const currentConfig = selectedTag ? tagConfig[selectedTag] : null;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Input de chat */}
        <div className="relative">
          <input
            id="chat-input"
            type="text"
            value={chatInputValue}
            onChange={(e) => {
              setChatInputValue(e.target.value);
              setError(null); // Limpar erro ao digitar
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && selectedTag) {
                e.preventDefault();
                // Se todas tags preenchidas, fazer submit final
                if (allTagsCompleted) {
                  handleAction();
                } else {
                  handleChatSubmit();
                  // Manter foco após submit
                  setTimeout(() => {
                    document.getElementById("chat-input")?.focus();
                  }, 0);
                }
              }
            }}
            placeholder={
              currentConfig?.placeholder || "Select a tag to start..."
            }
            disabled={!selectedTag || creating}
            autoFocus={!!selectedTag}
            className={`
                w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-2xl outline-none transition-all duration-200
                ${
                  selectedTag && currentConfig
                    ? "bg-white"
                    : "bg-white text-gray-400 cursor-not-allowed"
                }
              `}
          />

          {/* Botão de envio */}
          {selectedTag && (
            <button
              type="button"
              onClick={() => {
                if (chatInputValue.trim()) {
                  // Se todas tags preenchidas, fazer submit final
                  if (allTagsCompleted) {
                    handleAction();
                  } else {
                    handleChatSubmit();
                    // Manter foco após submit
                    setTimeout(() => {
                      document.getElementById("chat-input")?.focus();
                    }, 0);
                  }
                }
              }}
              disabled={creating || !chatInputValue.trim()}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 ${
                chatInputValue.trim() ? "bg-gray-400" : "bg-gray-300"
              }`}
              style={
                chatInputValue.trim()
                  ? {
                      backgroundColor: currentConfig?.color.border,
                    }
                  : {}
              }
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : chatInputValue.trim() ? (
                <ArrowRight className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </button>
          )}
        </div>

        {/* Espaço reservado para ícones das tags preenchidas - SEMPRE VISÍVEL */}
        <div className="mt-2 h-12 flex flex-wrap gap-2 justify-center">
          {completedTags.map((tagName) => {
            const config = tagConfig[tagName];
            const IconComponent = config.icon;
            const isActive = selectedTag === tagName;

            return (
              <button
                key={tagName}
                onClick={() => {
                  // Remove da lista de completadas (volta pro carrossel)
                  setCompletedTags((prev) => prev.filter((t) => t !== tagName));
                  // Limpa o valor salvo
                  setUserContext((prev) => ({
                    ...prev,
                    [tagName]: "",
                  }));
                  // Se era a tag ativa, desseleciona
                  if (selectedTag === tagName) {
                    setSelectedTag(null);
                    setChatInputValue("");
                  }
                }}
                className={`
                      flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white transition-all duration-200
                      ${isActive ? "scale-110" : "hover:scale-110"}
                    `}
                title={`${config.label} - Clique para remover`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: config.color.bg }}
                >
                  <IconComponent
                    className="w-3 h-3"
                    style={{ color: config.color.border }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-10 " style={{ backgroundColor: "#fcfcf9" }}>
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
          
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Garantir que a rolagem funcione */
          #chat-container {
            scroll-behavior: smooth;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
            pointer-events: auto !important;
            touch-action: pan-y !important;
          }
          
          /* Esconder scrollbar em todos os browsers */
          #chat-container::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          
          #chat-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `,
        }}
      />
      <div className="max-w-5xl mx-auto px-2 sm:px-6 lg:px-4 text-center">
        {/* Chat interativo */}
        <div
          className="max-w-5xl mx-auto mt-4 rounded-2xl"
          style={{
            height: "500px",
            backgroundColor: "#fcfcf9",
          }}
        >
          {/* Chat Messages - CONTEÚDO ROLÁVEL */}
          <div
            id="chat-container"
            className="overflow-y-auto px-6 py-4 space-y-3"
            style={{
              height: "calc(100% - 110px)", // Altura total menos título e input
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitScrollbar: { display: "none" },
            }}
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight mb-2">
                Smarter Research. Faster Outreach. More Selling
              </h1>
              <p className="text-lg text-gray-600">
                WebApp is your personal research assistant that works even when
                you sleep
              </p>
            </div>
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex items-end gap-2 animate-fadeIn ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
                style={{
                  animationDelay: `${index * 0.3}s`,
                  animation: "fadeIn 0.5s ease-in-out",
                }}
              >
                {/* Avatar - Bot (esquerda) */}
                {!message.isUser && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`px-4 py-3 text-sm text-left ${
                    message.isUser
                      ? "bg-gray-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={{
                    borderRadius: message.isUser
                      ? "20px 20px 2px 20px"
                      : "20px 20px 20px 2px",
                    wordBreak: "break-word",
                    maxWidth: "70%",
                    width: "fit-content",
                  }}
                >
                  {message.text}
                </div>

                {/* Avatar - User (direita) */}
                {message.isUser && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-500">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading do bot - sempre o mesmo componente */}
            {isBotTyping && (
              <div className="flex items-end gap-2 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div
                  className="px-4 py-3 bg-gray-100 text-sm"
                  style={{
                    borderRadius: "20px 20px 20px 2px",
                    wordBreak: "break-word",
                    maxWidth: "70%",
                    width: "fit-content",
                  }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INPUT FIXO - NÃO ROLA */}
          <div className="p-4x">
            {/* Tags logo acima do chat */}
            <div>
              <TagCarousel />
            </div>
            <ChatInterface />
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Botões CTA - Só aparecem quando todas tags estão preenchidas */}
        {allTagsCompleted && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
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
        )}
      </div>
    </section>
  );
}
