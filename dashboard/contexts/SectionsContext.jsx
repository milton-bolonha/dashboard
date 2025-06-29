"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useWorkspace } from "./WorkspaceContext";
import { fetchWithWorkspace } from "@/lib/api"; // Importar nosso wrapper

const SectionsContext = createContext();

export function SectionsProvider({ children }) {
  const { currentWorkspace } = useWorkspace();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSections = useCallback(async () => {
    if (!currentWorkspace) {
      console.log(
        "⚠️ SectionsContext: Nenhum workspace atual, pulando carregamento"
      );
      setSections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(
        `🔍 SectionsContext: Buscando sections do workspace: ${currentWorkspace.name}`
      );

      // Usar o wrapper padronizado
      const response = await fetchWithWorkspace("/api/sections", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

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
      console.log(
        `✅ SectionsContext: ${
          data.sections?.length || 0
        } sections carregadas para ${currentWorkspace.name}`
      );
      setSections(data.sections || []);
    } catch (error) {
      console.error("❌ SectionsContext: Erro ao carregar sections:", error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]); // Depender de currentWorkspace para recriar a função

  const refreshSections = useCallback(() => {
    console.log("🔄 SectionsContext: Refresh manual das sections...");
    loadSections();
  }, [loadSections]);

  // Carregar sections na inicialização e quando a função loadSections mudar (ou seja, quando o workspace mudar)
  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("🔄 SectionsContext: Auto-refresh das sections (30s)");
      loadSections();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadSections]); // Reiniciar o intervalo se o workspace mudar

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
