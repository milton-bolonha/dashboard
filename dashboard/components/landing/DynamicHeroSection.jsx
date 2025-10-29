"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Globe,
  Zap,
  Target,
  Search,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { dynamicIconMap } from "./DynamicIconMap";
import { createTileDebugLogger } from "@/lib/tile-debug-logger";
import AutoLoadingModal from "./AutoLoadingModal";

export default function DynamicHeroSection({
  mode = "landing",
  onCreateWorkspace,
}) {
  const {
    themes,
    selectedTheme,
    setSelectedTheme,
    loading: themeLoading,
  } = useTheme();

  const [selectedThemeId, setSelectedThemeId] = useState(null); // ⭐ NOVO: Tema escolhido pelo usuário
  const [inputs, setInputs] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);
  const [chatInputValue, setChatInputValue] = useState("");
  const [completedTags, setCompletedTags] = useState([]);
  const [inputStates, setInputStates] = useState({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentBotQuestion, setCurrentBotQuestion] = useState(null);
  const [showInitialMessages, setShowInitialMessages] = useState(false);

  const chatContainerRef = useRef(null);
  const scrollContainer = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ⭐ NOVO: Temas disponíveis como "tags"
  const availableThemes = themes || [];

  // ⭐ NOVO: Tags do tema atual (só aparecem após escolher tema)
  const currentTheme = selectedThemeId
    ? themes.find((t) => t.id === selectedThemeId)
    : null;
  const themeTags = currentTheme?.landingTags || [];

  // Inicializar states quando tema for selecionado
  useEffect(() => {
    if (!selectedThemeId || !currentTheme?.landingTags) return;

    const initialStates = {};
    const initialInputs = {};

    currentTheme.landingTags.forEach((tag) => {
      initialStates[tag.id] = {
        focused: false,
        hasContent: false,
        isValid: false,
      };
      initialInputs[tag.id] = "";
    });

    setInputStates(initialStates);
    setInputs(initialInputs);
    setSelectedTag(null);
  }, [selectedThemeId]);

  // ⭐ NOVO: Animações iniciais - pedir para escolher tema
  useEffect(() => {
    if (themeLoading || chatMessages.length > 0) return;

    const timer1 = setTimeout(() => {
      setIsBotTyping(true);
    }, 1000);

    const timer2 = setTimeout(() => {
      setIsBotTyping(false);
      setChatMessages([
        {
          text: "Choose a theme to get started!",
          isUser: false,
        },
      ]);
    }, 3000);

    const timer3 = setTimeout(() => {
      setShowInitialMessages(true);
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [themeLoading]);

  // Mostrar pergunta da tag
  useEffect(() => {
    if (!selectedTag || !selectedThemeId) return;

    const currentTagObj = themeTags.find((t) => t.id === selectedTag);
    if (!currentTagObj || currentBotQuestion === selectedTag) return;

    setCurrentBotQuestion(selectedTag);
    const question =
      currentTagObj?.placeholder || "Please provide more information";

    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          text: question,
          isUser: false,
        },
      ]);
    }, 1500);
  }, [selectedTag, currentBotQuestion, themeTags, selectedThemeId]);

  // Scroll do chat
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const scroll = () => {
      container.scrollTop = container.scrollHeight;
    };

    requestAnimationFrame(() => {
      scroll();
      setTimeout(scroll, 10);
      setTimeout(scroll, 50);
      setTimeout(scroll, 100);
    });
  }, [chatMessages, isBotTyping]);

  // Verificar scroll do carrossel
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainer.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainer.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [completedTags, selectedThemeId]); // ⭐ Update: incluir selectedThemeId

  // ⭐ NOVO: Handler para selecionar tema
  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setSelectedTheme(theme);

      // Adicionar mensagem no chat
      setChatMessages((prev) => [
        ...prev,
        {
          text: theme.name,
          isUser: true,
        },
      ]);

      // ⭐ OTIMIZAÇÃO: Mostrar mensagem imediatamente
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: `Great! Now let's fill out the details for your ${theme.name.toLowerCase()}. Choose a field below to get started.`,
            isUser: false,
          },
        ]);
      }, 1000);
    }
  };

  const validateInput = (value, type) => {
    if (!value || value.trim().length === 0) return false;
    if (type === "url" && !isValidUrl(value)) return false;
    if (value.trim().length < 3) return false;
    return true;
  };

  const isValidUrl = (str) => {
    try {
      const url = new URL(str.startsWith("http") ? str : `https://${str}`);
      return true;
    } catch {
      return false;
    }
  };

  const getIconComponent = (iconName) => {
    return dynamicIconMap[iconName] || Briefcase;
  };

  const getIconColor = (tagId) => {
    const colors = {
      company: { border: "#3B82F6", bg: "#EFF6FF" },
      solution: { border: "#8B5CF6", bg: "#F5F3FF" },
      target: { border: "#F59E0B", bg: "#FEF3C7" },
      targetWebsite: { border: "#EF4444", bg: "#FEE2E2" },
      bookTitle: { border: "#8B5CF6", bg: "#F5F3FF" },
      genre: { border: "#EC4899", bg: "#FCE7F3" },
      theme: { border: "#F59E0B", bg: "#FEF3C7" },
      targetAudience: { border: "#10B981", bg: "#D1FAE5" },
      projectName: { border: "#F59E0B", bg: "#FEF3C7" },
      role: { border: "#10B981", bg: "#D1FAE5" },
    };
    return colors[tagId] || { border: "#6B7280", bg: "#F3F4F6" };
  };

  // ⭐ NOVO: Cores para temas
  const getThemeColor = (themeId) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme?.colors) {
      return {
        border: theme.colors.primary,
        bg: theme.colors.chatBubble || theme.colors.background,
      };
    }
    return { border: "#6B7280", bg: "#F3F4F6" };
  };

  const handleTagSelect = (tagId) => {
    setSelectedTag(tagId);
    setChatInputValue(inputs[tagId] || "");
    setError(null);
  };

  const handleInputChange = (tagId, value) => {
    setChatInputValue(value);
    setInputs((prev) => ({ ...prev, [tagId]: value }));
    setError(null);

    const type = themeTags.find((t) => t.id === tagId)?.type || "text";
    setInputStates((prev) => ({
      ...prev,
      [tagId]: {
        focused: true,
        hasContent: value.length > 0,
        isValid: validateInput(value, type),
      },
    }));
  };

  const handleChatSubmit = () => {
    if (!selectedTag || !chatInputValue.trim()) return;

    const trimmedValue = chatInputValue.trim();
    const tag = themeTags.find((t) => t.id === selectedTag);

    if (tag.type === "url" && !isValidUrl(trimmedValue)) {
      setError("Please enter a valid URL (e.g., www.example.com)");
      return;
    }

    if (trimmedValue.length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }

    setError(null);

    setChatMessages((prev) => [...prev, { text: trimmedValue, isUser: true }]);
    setInputs((prev) => ({ ...prev, [selectedTag]: trimmedValue }));

    if (!completedTags.includes(selectedTag)) {
      setCompletedTags((prev) => [...prev, selectedTag]);
    }

    setTimeout(() => {
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: "Perfect! Now tap another tag to continue filling out your details.",
            isUser: false,
          },
        ]);
      }, 1000);
    }, 500);

    setChatInputValue("");
    setSelectedTag(null);
  };

  const handleSubmit = async () => {
    // ⭐ EDGE CASE: Prevenir múltiplos submits
    if (!allInputsValid || creating) return;

    setCreating(true);
    setError(null);

    // ⭐ DEBUG: Log do início do processo
    const debugLogger = createTileDebugLogger("pending", selectedThemeId);
    debugLogger.landingFormSubmit(inputs);

    try {
      // ⭐ EDGE CASE: Validar se selectedThemeId existe
      if (!selectedThemeId) {
        throw new Error(
          "Nenhum tema selecionado. Por favor, selecione um tema primeiro."
        );
      }

      // ⭐ EDGE CASE: Validar se todos os inputs obrigatórios estão preenchidos
      const requiredTags =
        selectedTheme?.landingTags?.filter((tag) => tag.required) || [];
      const missingRequired = requiredTags.filter(
        (tag) => !inputs[tag.id]?.trim()
      );

      if (missingRequired.length > 0) {
        throw new Error(
          `Campos obrigatórios não preenchidos: ${missingRequired
            .map((tag) => tag.label)
            .join(", ")}`
        );
      }

      // ⭐ PERFORMANCE: Gerar guest_id único com timestamp e random
      const guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // ⭐ EDGE CASE: Verificar se cookies são suportados
      try {
        document.cookie = `guest_id=${guestId}; Path=/; Max-Age=604800; SameSite=Lax`;
      } catch (cookieError) {
        console.warn("⚠️ Cookie não pôde ser definido:", cookieError);
        // Continuar mesmo sem cookie - o backend pode usar outro método
      }

      if (mode === "create-workspace" && onCreateWorkspace) {
        // ⭐ EDGE CASE: Timeout para callback personalizado
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Timeout: Operação demorou muito para completar")
              ),
            30000
          )
        );

        await Promise.race([onCreateWorkspace(inputs), timeoutPromise]);
      } else {
        // ⭐ ERROR HANDLING: AbortController para cancelar requisição se necessário
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30s timeout

        try {
          const response = await fetch("/api/guest/workspace", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              themeId: selectedThemeId,
              context: inputs,
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          // ⭐ EDGE CASE: Verificar se a resposta é JSON válido
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            throw new Error(
              `Resposta inválida do servidor: ${response.status} ${response.statusText}`
            );
          }

          if (!response.ok) {
            // ⭐ ERROR HANDLING: Diferentes tipos de erro
            if (response.status === 400) {
              throw new Error(data.error || "Dados inválidos enviados");
            } else if (response.status === 409) {
              throw new Error("Workspace já existe. Tente novamente.");
            } else if (response.status >= 500) {
              throw new Error(
                "Erro interno do servidor. Tente novamente em alguns minutos."
              );
            } else {
              throw new Error(
                data.error || `Erro ${response.status}: ${response.statusText}`
              );
            }
          }

          // ⭐ DEBUG: Log de sucesso
          debugLogger.workspaceCreated(guestId);

          // 🚀 PRELOAD: Disparar preload de 2 tiles rápidos (não aguarda)
          if (selectedThemeId === "sales-assistant") {
            console.log("🚀 PRELOAD: Disparando preload de tiles...");
            debugLogger.landingPreloadTriggered();

            // ⭐ PERFORMANCE: Preload não-bloqueante com error handling
            fetch("/api/guest/preload-tiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                guestId: guestId,
                tilesCount: 2, // Apenas os 2 primeiros tiles (rápidos)
              }),
            })
              .then((response) => {
                if (!response.ok) {
                  console.warn("⚠️ Preload falhou:", response.status);
                } else {
                  console.log("✅ Preload iniciado com sucesso");
                }
              })
              .catch((err) => {
                console.warn("⚠️ Preload falhou (ok):", err.message);
              });
          }

          // ⭐ DEBUG: Log de redirect
          debugLogger.landingRedirect();

          // ⭐ EDGE CASE: Verificar se window.location está disponível
          if (typeof window !== "undefined" && window.location) {
            // Redireciona imediatamente (não aguarda preload)
            window.location.href = "/admin";
          } else {
            throw new Error("Redirecionamento não disponível neste ambiente");
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);

          // ⭐ ERROR HANDLING: Diferentes tipos de erro de rede
          if (fetchError.name === "AbortError") {
            throw new Error("Operação cancelada por timeout. Tente novamente.");
          } else if (
            fetchError.name === "TypeError" &&
            fetchError.message.includes("fetch")
          ) {
            throw new Error(
              "Erro de conexão. Verifique sua internet e tente novamente."
            );
          } else {
            throw fetchError;
          }
        }
      }
    } catch (err) {
      // ⭐ ERROR HANDLING: Log detalhado do erro
      console.error("❌ Error creating workspace:", err);

      // ⭐ DEBUG: Log de erro
      debugLogger.error("workspace_creation", err, {
        selectedThemeId,
        inputs: Object.keys(inputs),
        userAgent: navigator.userAgent,
      });

      // ⭐ UX: Mensagem de erro amigável
      let errorMessage = "Falha ao criar workspace";

      if (err.message.includes("timeout")) {
        errorMessage = "A operação demorou muito. Tente novamente.";
      } else if (
        err.message.includes("conexão") ||
        err.message.includes("network")
      ) {
        errorMessage = "Problema de conexão. Verifique sua internet.";
      } else if (err.message.includes("tema")) {
        errorMessage = err.message;
      } else if (err.message.includes("obrigatórios")) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setCreating(false);
    }
  };

  const allInputsValid = themeTags?.every((tag) => {
    const state = inputStates[tag.id];
    return state?.isValid === true;
  });

  if (themeLoading || !themes || themes.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fcfcf9" }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const colors = currentTheme?.colors || {};
  const tags = themeTags || [];
  const currentTag = tags.find((t) => t.id === selectedTag);

  return (
    <div
      className="h-screen flex flex-col pt-20"
      style={{ backgroundColor: "#fcfcf9" }}
    >
      {/* Chat Container - Scrollável */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar scrollbar-hide"
        style={{ paddingBottom: "18rem" }}
      >
        <div className="max-w-4xl mx-auto w-full px-4">
          <div id="chat-container" className="space-y-4">
            <div className="text-center pb-4 flex-shrink-0 ">
              <h1 className="text-5xl font-bold mt-8 mb-3 text-gray-900">
                Calm Down, We're Here!
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto px-4">
                We'll help you create a professional anything you need app.
              </p>
            </div>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.isUser ? "justify-end" : "justify-start"
                } animate-slideUp`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    msg.isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isUser ? "bg-gray-800" : "bg-gray-200"
                    }`}
                  >
                    {msg.isUser ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                  {/* Mensagem */}
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.isUser
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex justify-start animate-slideUp">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container fixo no bottom: Tags + Input */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ backgroundColor: "#fcfcf9" }}
      >
        {/* Tags Acima do Input */}
        <div className="px-6 py-2">
          <div className="max-w-4xl mx-auto relative">
            {canScrollLeft && (
              <button
                onClick={() =>
                  scrollContainer.current?.scrollBy({
                    left: -200,
                    behavior: "smooth",
                  })
                }
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}

            <div
              ref={scrollContainer}
              className="flex gap-2 overflow-x-auto px-8 scrollbar-hide justify-center"
            >
              {/* ⭐ NOVO: Mostrar temas se nenhum foi escolhido */}
              {!selectedThemeId &&
                availableThemes.map((theme) => {
                  const IconComponent = getIconComponent(
                    theme.icon || "Briefcase"
                  );
                  const themeColor = getThemeColor(theme.id);

                  return (
                    <div
                      key={theme.id}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      <button
                        onClick={() => handleThemeSelect(theme.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all h-10 bg-white border-gray-200 hover:border-gray-300"
                        title={theme.description}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: themeColor.bg }}
                        >
                          <IconComponent
                            className="w-3 h-3"
                            style={{ color: themeColor.border }}
                          />
                        </div>
                        <span className="font-medium text-sm text-gray-700">
                          {theme.name}
                        </span>
                      </button>
                    </div>
                  );
                })}

              {/* ⭐ Mostrar ícone do tema escolhido */}
              {selectedThemeId && (
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSelectedThemeId(null);
                      setChatMessages((prev) => [
                        ...prev,
                        {
                          text: "Theme reset. Choose a new theme to continue.",
                          isUser: false,
                        },
                      ]);
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      backgroundColor: getThemeColor(selectedThemeId).bg,
                    }}
                    title={`Selected: ${currentTheme?.name}`}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(
                        currentTheme?.icon || "Briefcase"
                      );
                      const themeColor = getThemeColor(selectedThemeId);
                      return (
                        <IconComponent
                          className="w-5 h-5"
                          style={{ color: themeColor.border }}
                        />
                      );
                    })()}
                  </button>
                </div>
              )}

              {/* ⭐ Mostrar tags do tema (só aparecem após escolher tema) */}
              {selectedThemeId &&
                themeTags.map((tag) => {
                  const IconComponent = getIconComponent(tag.icon);
                  const iconColor = getIconColor(tag.id);
                  const isCompleted = completedTags.includes(tag.id);
                  const hasValue = inputs[tag.id]?.trim().length > 0;

                  return (
                    <div
                      key={tag.id}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                      {/* Mostrar só se NÃO está completada */}
                      {!isCompleted && (
                        <button
                          onClick={() => handleTagSelect(tag.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all h-10 ${
                            selectedTag === tag.id
                              ? "bg-gray-100 border-gray-300"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                          title={tag.tooltip}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: iconColor.bg }}
                          >
                            <IconComponent
                              className="w-3 h-3"
                              style={{ color: iconColor.border }}
                            />
                          </div>
                          <span className="font-medium text-sm text-gray-700">
                            {tag.label}
                          </span>
                        </button>
                      )}

                      {/* Mostrar ícone abaixo quando está completada */}
                      {isCompleted && (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              setInputs((prev) => ({ ...prev, [tag.id]: "" }));
                              setInputStates((prev) => ({
                                ...prev,
                                [tag.id]: {
                                  focused: false,
                                  hasContent: false,
                                  isValid: false,
                                },
                              }));
                              setCompletedTags((prev) =>
                                prev.filter((t) => t !== tag.id)
                              );
                              setChatInputValue("");
                            }}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{ backgroundColor: iconColor.bg }}
                            title={`Reset ${tag.label}`}
                          >
                            <IconComponent
                              className="w-5 h-5"
                              style={{ color: iconColor.border }}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {canScrollRight && (
              <button
                onClick={() =>
                  scrollContainer.current?.scrollBy({
                    left: 200,
                    behavior: "smooth",
                  })
                }
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Input Fixo no Bottom */}
        <div className="pb-4 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                id="chat-input"
                type={currentTag?.type || "text"}
                value={chatInputValue}
                onChange={(e) => handleInputChange(selectedTag, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (allInputsValid) {
                      handleSubmit();
                    } else {
                      handleChatSubmit();
                    }
                  }
                }}
                placeholder={
                  !selectedThemeId
                    ? "Choose a theme above to get started..."
                    : selectedTag
                    ? currentTag?.placeholder
                    : "Choose a tag above to get started..."
                }
                disabled={!selectedThemeId || !selectedTag || creating}
                className="w-full px-6 py-4 pr-20 text-lg border border-gray-200 rounded-full outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                style={{ backgroundColor: selectedTag ? "#fff" : "#fcfcf9" }}
              />

              {selectedTag && (
                <button
                  type="button"
                  onClick={allInputsValid ? handleSubmit : handleChatSubmit}
                  disabled={!chatInputValue.trim() || creating}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: getIconColor(selectedTag).border,
                  }}
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Botão Reset */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={async () => {
                  if (!confirm("Reset all data?")) return;
                  await fetch("/api/guest/reset", { method: "DELETE" }).catch(
                    () => {}
                  );
                  window.location.reload();
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Modal de loading automático */}
      <AutoLoadingModal isOpen={creating} delay={2000} />
    </div>
  );
}
