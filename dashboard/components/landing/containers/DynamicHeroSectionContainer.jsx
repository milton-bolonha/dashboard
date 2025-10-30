import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useHeroValidation } from "../shared/useHeroValidation";
import { useHeroWorkspace } from "../shared/useHeroWorkspace";
import { useHeroInputStates } from "../shared/useHeroInputStates";

export default function DynamicHeroSectionContainer({
  children,
  mode,
  onCreateWorkspace,
}) {
  const {
    themes,
    selectedTheme,
    setSelectedTheme,
    loading: themeLoading,
  } = useTheme();
  const { validateInput } = useHeroValidation();
  const { creating, error, createGuestWorkspace, setError } =
    useHeroWorkspace();

  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [chatInputValue, setChatInputValue] = useState("");
  const [completedTags, setCompletedTags] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentBotQuestion, setCurrentBotQuestion] = useState(null);

  const currentTheme = selectedThemeId
    ? themes.find((t) => t.id === selectedThemeId)
    : null;
  const themeTags = currentTheme?.landingTags || [];
  const fields = themeTags.map((tag) => tag.id);
  const {
    inputs,
    inputStates,
    updateInputState,
    setInputFocus,
    allValid,
    setInputs,
    setInputStates,
  } = useHeroInputStates(fields, validateInput);

  // Animações iniciais
  useEffect(() => {
    if (themeLoading || chatMessages.length > 0) return;

    const timer1 = setTimeout(() => setIsBotTyping(true), 1000);
    const timer2 = setTimeout(() => {
      setIsBotTyping(false);
      setChatMessages([
        { text: "Choose a theme to get started!", isUser: false },
      ]);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [themeLoading, chatMessages]);

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
      setChatMessages((prev) => [...prev, { text: question, isUser: false }]);
    }, 1500);
  }, [selectedTag, currentBotQuestion, themeTags, selectedThemeId]);

  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setSelectedTheme(theme);
      setChatMessages((prev) => [...prev, { text: theme.name, isUser: true }]);

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

  const handleTagSelect = (tagId) => {
    setSelectedTag(tagId);
    setChatInputValue(inputs[tagId] || "");
    setError(null);
  };

  // ⭐ NOVO: Confirmar tag (NUNCA submete workspace)
  const handleConfirmTag = () => {
    if (!selectedTag || !chatInputValue.trim()) return;

    const tag = themeTags.find((t) => t.id === selectedTag);
    if (tag.type === "url" && !validateInput(chatInputValue, "url")) {
      setError("Invalid URL");
      return;
    }

    // Salvar input
    updateInputState(selectedTag, chatInputValue.trim(), tag.type);

    // Adicionar ao chat
    setChatMessages((prev) => [
      ...prev,
      { text: chatInputValue.trim(), isUser: true },
    ]);

    // Marcar como completada
    setCompletedTags((prev) => [...prev, selectedTag]);

    // Limpar
    setChatInputValue("");
    setSelectedTag(null);

    // Mensagem do bot
    const isLastTag = completedTags.length + 1 === themeTags.length;
    setTimeout(() => {
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            text: isLastTag
              ? "Perfect! Click the green button to create your workspace!"
              : "Great! Choose another tag to continue.",
            isUser: false,
          },
        ]);
      }, 1000);
    }, 500);
  };

  // ⭐ NOVO: Submit final (SEPARADO)
  const handleFinalSubmit = async () => {
    if (!allValid || creating) return;
    await createGuestWorkspace(selectedThemeId, inputs);
  };

  const handleInputChange = (tagId, value) => {
    setChatInputValue(value);
    updateInputState(tagId, value);
    setError(null);
  };

  return children({
    // Theme data
    themes,
    selectedThemeId,
    currentTheme,
    themeTags,
    themeLoading,

    // Chat data
    selectedTag,
    chatInputValue,
    completedTags,
    chatMessages,
    isBotTyping,

    // Input data
    inputs,
    inputStates,
    allValid,

    // State
    creating,
    error,

    // Handlers
    handleThemeSelect,
    handleTagSelect,
    handleConfirmTag, // ⭐ Confirmar tag
    handleFinalSubmit, // ⭐ Submit workspace
    handleInputChange,
    setChatInputValue,
    setError,
    setSelectedThemeId,
    setChatMessages,
  });
}
