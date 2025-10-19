"use client";

import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Link from "next/link";
import HeroSection from "@/components/landing/HeroSection";

/**
 * Tela de criação de workspace que replica o HeroSection da landing
 * Mostrada quando o usuário está logado mas não tem nenhum workspace
 */
export default function CreateWorkspaceScreen() {
  const { user } = useUser();
  const { createWorkspace } = useWorkspace();

  const handleCreateWorkspace = async (userContext) => {
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
  };

  return (
    // Layout clean sem sidebar/topbar
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header minimalista */}
      <header className="bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
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

      {/* Hero Section - Componente compartilhado */}
      <div className="flex-1 overflow-auto">
        <HeroSection
          mode="create-workspace"
          onCreateWorkspace={handleCreateWorkspace}
        />
      </div>

      {/* Botão de ajuda flutuante */}
      <button className="fixed bottom-8 right-8 w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50">
        <span className="text-gray-600 font-semibold text-lg">?</span>
      </button>
    </div>
  );
}
