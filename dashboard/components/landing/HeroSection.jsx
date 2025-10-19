"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

/**
 * HeroSection compartilhado entre Landing e Create Workspace
 * @param {Object} props
 * @param {string} props.mode - "landing" ou "create-workspace"
 * @param {Function} props.onCreateWorkspace - Callback para criar workspace (modo create-workspace)
 */
export default function HeroSection({ mode = "landing", onCreateWorkspace }) {
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
  useEffect(() => {
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

  const handleAction = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === "create-workspace" && onCreateWorkspace) {
      setCreating(true);
      setError(null);
      try {
        await onCreateWorkspace(userContext);
      } catch (err) {
        setError(err.message);
      } finally {
        setCreating(false);
      }
    } else {
      // Landing mode: poderia redirecionar para sign up
      console.log("Landing mode: ready to sign up with context:", userContext);
    }
  };

  return (
    <section className="h-full bg-white flex items-center justify-center">
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

        {/* Inputs de Contexto com Ícones */}
        <div className="space-y-4 mb-8">
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
        <p className="text-lg text-black mb-6">
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
            onClick={handleAction}
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
            onClick={handleAction}
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
  );
}
