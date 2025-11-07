"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { HomeHero } from "@/containers/home/components/HomeHero";
import { HomeForm } from "@/containers/home/components/HomeForm";

interface GeneratePayload {
  companyName: string;
  companyWebsite: string;
  solution: string;
}

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: GeneratePayload) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      router.push("/admin");
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),_transparent_60%)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <HomeHero />
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 pb-24">
          <HomeForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </main>
      </div>
    </div>
  );
}

