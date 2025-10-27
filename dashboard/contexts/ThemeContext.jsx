"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// ⭐ FALLBACK: Temas base hardcoded caso API falhe
const FALLBACK_THEMES = [
  {
    id: "sales-assistant",
    name: "Sales Assistant",
    slug: "sales",
    description: "Research companies and generate personalized outreach",
    icon: "💼",
    colors: {
      primary: "#6B7280",
      secondary: "#3B82F6",
      background: "#ffffff",
      chatBubble: "#F3F4F6",
    },
    landingTags: [
      {
        id: "company",
        label: "Company",
        icon: "Briefcase",
        placeholder: "I am a sales rep at...",
        tooltip: "Which company do you represent?",
        type: "text",
        order: 1,
        required: true,
        mapToEntity: "workspace",
        mapToField: "salesRepAt",
      },
      {
        id: "solution",
        label: "Solution",
        icon: "Zap",
        placeholder: "I am selling solutions for...",
        tooltip: "What are you selling?",
        type: "text",
        order: 2,
        required: true,
        mapToEntity: "workspace",
        mapToField: "sellingSolutionsFor",
      },
      {
        id: "target",
        label: "Research Target",
        icon: "Target",
        placeholder: "Company name to research",
        tooltip: "Which company do you want to research?",
        type: "text",
        order: 3,
        required: true,
        mapToEntity: "company",
        mapToField: "name",
      },
      {
        id: "targetWebsite",
        label: "Target Website",
        icon: "Globe",
        placeholder: "www.targetcompany.com",
        tooltip: "Target company's website URL",
        type: "url",
        order: 4,
        required: false,
        mapToEntity: "company",
        mapToField: "website",
      },
    ],
    config: {
      allowMultipleMainEntities: true,
      defaultView: "grid",
      features: ["ai-generation", "file-upload", "notes"],
    },
  },
  {
    id: "book-creator",
    name: "Book Creator",
    slug: "book-creator",
    description: "Create books with AI-powered chapters and characters",
    icon: "📚",
    colors: {
      primary: "#8B5CF6",
      secondary: "#EC4899",
      background: "#FEF3C7",
      chatBubble: "#F5F3FF",
    },
    landingTags: [
      {
        id: "bookTitle",
        label: "Book Title",
        icon: "Book",
        placeholder: "What's your book title?",
        tooltip: "Enter the title of your book",
        type: "text",
        order: 1,
        required: true,
      },
      {
        id: "genre",
        label: "Genre",
        icon: "Sparkles",
        placeholder: "Fantasy, Romance, Thriller...",
        tooltip: "What genre is your book?",
        type: "text",
        order: 2,
        required: false,
      },
    ],
    config: {
      allowMultipleMainEntities: true,
      defaultView: "list",
      features: ["ai-generation", "file-upload", "notes"],
    },
  },
];

export function ThemeProvider({ children }) {
  const [themes, setThemes] = useState(FALLBACK_THEMES);
  const [selectedTheme, setSelectedTheme] = useState(FALLBACK_THEMES[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThemes();
  }, []);

  async function loadThemes() {
    try {
      const response = await fetch("/api/themes");

      // Se servidor não está rodando, usar fallback silenciosamente
      if (!response.ok) {
        console.warn(
          "Development server may not be running. Using fallback themes."
        );
        setThemes(FALLBACK_THEMES);
        setSelectedTheme(FALLBACK_THEMES[0]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Verificar se temos temas válidos
      if (data.themes && data.themes.length > 0) {
        setThemes(data.themes);
        setSelectedTheme(data.themes[0]);
      } else {
        // Usar fallback
        console.warn("API returned empty themes, using fallback");
        setThemes(FALLBACK_THEMES);
        setSelectedTheme(FALLBACK_THEMES[0]);
      }

      setLoading(false);
    } catch (error) {
      // Silenciar erro se for erro de rede (servidor offline)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.warn(
          "Development server may not be running. Using fallback themes."
        );
      } else {
        console.error("Failed to load themes from API:", error.message);
      }
      // Usar fallback em caso de erro
      setThemes(FALLBACK_THEMES);
      setSelectedTheme(FALLBACK_THEMES[0]);
      setLoading(false);
    }
  }

  return (
    <ThemeContext.Provider
      value={{ themes, selectedTheme, setSelectedTheme, loading }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
