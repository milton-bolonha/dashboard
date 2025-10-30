import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Bot,
  Briefcase,
} from "lucide-react";
import { dynamicIconMap } from "../DynamicIconMap";
import AutoLoadingModal from "../AutoLoadingModal";

export default function DynamicHeroPresenter({
  themes,
  selectedThemeId,
  currentTheme,
  themeTags,
  themeLoading,
  selectedTag,
  chatInputValue,
  completedTags,
  chatMessages,
  isBotTyping,
  allValid,
  creating,
  handleThemeSelect,
  handleTagSelect,
  handleConfirmTag,
  handleFinalSubmit,
  handleInputChange,
  setChatInputValue,
  setSelectedThemeId,
  setChatMessages,
}) {
  const chatContainerRef = useRef(null);
  const scrollContainer = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [completedTags, selectedThemeId]);

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
            <div className="text-center pb-4 flex-shrink-0">
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
              {/* Mostrar temas se nenhum foi escolhido */}
              {!selectedThemeId &&
                themes.map((theme) => {
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

              {/* Mostrar ícone do tema escolhido */}
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

              {/* Mostrar tags do tema */}
              {selectedThemeId &&
                themeTags.map((tag) => {
                  const IconComponent = getIconComponent(tag.icon);
                  const iconColor = getIconColor(tag.id);
                  const isCompleted = completedTags.includes(tag.id);

                  return (
                    <div
                      key={tag.id}
                      className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
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

                      {isCompleted && (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              // Reset tag logic here
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
                type={
                  themeTags.find((t) => t.id === selectedTag)?.type || "text"
                }
                value={chatInputValue}
                onChange={(e) => setChatInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirmTag(); // ⭐ SEMPRE confirma tag
                  }
                }}
                placeholder={
                  !selectedThemeId
                    ? "Choose a theme above to get started..."
                    : selectedTag
                    ? themeTags.find((t) => t.id === selectedTag)?.placeholder
                    : "Choose a tag above to get started..."
                }
                disabled={!selectedThemeId || !selectedTag || allValid} // ⭐ Disabled quando tudo válido
                className="w-full px-6 py-4 pr-20 text-lg border border-gray-200 rounded-full outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                style={{ backgroundColor: selectedTag ? "#fff" : "#fcfcf9" }}
              />

              {/* ⭐ Botão com cor da tag: confirmar tag (só aparece se NÃO allValid) */}
              {selectedTag && !allValid && (
                <button
                  type="button"
                  onClick={handleConfirmTag}
                  disabled={!chatInputValue.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: getIconColor(selectedTag).border,
                  }}
                >
                  <ArrowRight className="w-5 h-5 text-white flex-shrink-0" />
                </button>
              )}

              {/* ⭐ Botão verde: submit final (só aparece quando allValid) */}
              {allValid && (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={creating}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-green-500 hover:bg-green-600"
                  style={{
                    animation: creating
                      ? "none"
                      : "bouncePulse 4s ease-in-out infinite",
                  }}
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-white flex-shrink-0" />
                  )}
                </button>
              )}
            </div>

            {/* Botão Reset para Debug */}
            <div className="mt-2 flex justify-center">
              <button
                onClick={async () => {
                  if (!confirm("Reset all data?")) return;
                  try {
                    await fetch("/api/guest/reset", { method: "DELETE" });
                    alert("Reset successful! Refreshing page...");
                    window.location.reload();
                  } catch (err) {
                    alert("Reset failed: " + err.message);
                  }
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
        @keyframes bouncePulse {
          0%,
          100% {
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

      <AutoLoadingModal isOpen={creating} />
    </div>
  );
}
