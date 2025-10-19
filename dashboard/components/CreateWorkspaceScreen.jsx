"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Tela de criação de workspace que replica o HeroSection da landing
 * Mostrada quando o usuário está logado mas não tem nenhum workspace
 */
export default function CreateWorkspaceScreen() {
  const { user } = useUser();
  const { createWorkspace } = useWorkspace();
  const router = useRouter();

  const words = ["Duplicate", "Triplicate", "Multiple"];
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [userContext, setUserContext] = useState({
    company: "",
    solution: "",
    research: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Rotacionar palavras dinâmicas
  useState(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field, value) => {
    setUserContext((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateInputs = () => {
    if (!userContext.company.trim()) {
      return "Please tell us which company you represent";
    }
    if (!userContext.solution.trim()) {
      return "Please describe what you're selling";
    }
    if (!userContext.research.trim()) {
      return "Please tell us what you want to research";
    }
    return null;
  };

  const createWorkspaceFromInputs = async () => {
    try {
      setCreating(true);
      setError(null);

      console.log("🚀 Creating workspace from inputs:", userContext);

      await createWorkspace({
        name: userContext.company,
        description: `Sales rep for ${userContext.solution}. Researching: ${userContext.research}`,
        metadata: {
          solution: userContext.solution,
          researchTarget: userContext.research,
          createdVia: "onboarding-flow",
        },
      });

      console.log("✅ Workspace created successfully!");

      // O WorkspaceContext já redireciona automaticamente após criar
    } catch (err) {
      console.error("❌ Error creating workspace:", err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleConnectCRM = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    await createWorkspaceFromInputs();
  };

  const handleUploadCSV = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    await createWorkspaceFromInputs();
  };

  return (
    // Remover o layout do dashboard (sidebar, topbar) e usar layout clean
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header minimalista */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo WebApp */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-semibold text-black">WebApp</span>
            </Link>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Igual à landing */}
      <section className="min-h-screen bg-white flex items-center justify-center py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Título Principal */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight mb-8">
            Smarter Research. Faster Outreach.{" "}
            <span className="text-black">{currentWord}</span> Selling
          </h1>

          {/* Subtítulo */}
          <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
            WebApp is your personal research assistant that works even when you
            sleep
          </p>

          {/* Inputs de Contexto com Ícones */}
          <div className="space-y-6 mb-12">
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="I am a sales rep at"
                value={userContext.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="I am selling solutions for"
                value={userContext.solution}
                onChange={(e) => handleInputChange("solution", e.target.value)}
                className="w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="I want to conduct research on"
                value={userContext.research}
                onChange={(e) => handleInputChange("research", e.target.value)}
                className="w-full px-6 py-4 pr-16 text-lg border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Instrução */}
          <p className="text-lg text-black mb-12">
            Ask WebApp research your whole territory for you
          </p>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-2xl mx-auto">
              {error}
            </div>
          )}

          {/* Botões CTA com Setas */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleConnectCRM}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Connect CRM</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={handleUploadCSV}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
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

      {/* Footer minimalista */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-gray-600 font-semibold">?</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
