"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ClassicHeroForm } from "@/components/landing/ClassicHeroForm";
import { getFunctionsBaseUrl } from "@/lib/env";

import "@/components/landing/landing.css";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({
    company,
    companyWebsite,
    solution,
  }: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
  }) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const functionBase = getFunctionsBaseUrl().replace(/\/$/, "");
      const targetUrl = `${functionBase || ""}/.netlify/functions/ai-generate`;
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company,
          companyWebsite,
          solution,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao gerar insights");
      }

      push({
        title: "Insights gerados!",
        description: "Levando você para o dashboard.",
        variant: "success",
      });

      await router.push("/admin");
    } catch (error) {
      console.error("[HomeContainer] Failed to generate tiles", error);
      push({
        title: "Erro ao gerar",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetWorkspace = async () => {
    try {
      const response = await fetch("/api/workspace", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Não foi possível limpar o workspace");
      }
      push({
        title: "Workspace limpo",
        description: "Envie outro formulário para gerar novos insights.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Erro ao limpar",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="home-page">
      <LandingHeader />
      <main className="flex-1">
        <ClassicHeroForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onReset={handleResetWorkspace}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
