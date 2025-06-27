"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SectionsContext = createContext();

export function SectionsProvider({ children }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSections = async () => {
    try {
      setLoading(true);
      console.log("🔍 SectionsContext: Tentando buscar sections...");

      const response = await fetch("/api/sections");

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ SectionsContext: Erro na API de sections:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to fetch sections (status: ${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ SectionsContext: Sections carregadas:", data);
      setSections(data.sections || []);
    } catch (error) {
      console.error("❌ SectionsContext: Erro ao carregar sections:", error);
      // Em caso de erro, definir array vazio para não quebrar a UI
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSections = () => {
    console.log("🔄 SectionsContext: Refresh manual das sections...");
    loadSections();

    // Broadcast para outros componentes que as sections foram atualizadas
    window.dispatchEvent(
      new CustomEvent("sectionsUpdated", { detail: { timestamp: Date.now() } })
    );
  };

  // Carregar sections na inicialização
  useEffect(() => {
    loadSections();
  }, []);

  // Auto-refresh a cada 30 segundos para manter dados sincronizados
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("🔄 SectionsContext: Auto-refresh das sections (30s)");
      loadSections();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, []);

  // Escutar eventos de atualização de outros componentes
  useEffect(() => {
    const handleSectionsUpdate = () => {
      console.log("🔄 SectionsContext: Recebido evento de atualização");
      loadSections();
    };

    window.addEventListener("sectionsUpdated", handleSectionsUpdate);
    return () =>
      window.removeEventListener("sectionsUpdated", handleSectionsUpdate);
  }, []);

  const value = {
    sections,
    loading,
    refreshSections,
    setSections,
  };

  return (
    <SectionsContext.Provider value={value}>
      {children}
    </SectionsContext.Provider>
  );
}

export function useSections() {
  const context = useContext(SectionsContext);
  if (context === undefined) {
    throw new Error("useSections deve ser usado dentro de SectionsProvider");
  }
  return context;
}
