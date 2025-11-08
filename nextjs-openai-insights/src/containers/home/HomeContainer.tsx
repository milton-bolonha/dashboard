"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ClassicHeroForm } from "@/components/landing/ClassicHeroForm";
import "@/components/landing/landing.css";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  const handleSubmit = async ({
    company,
    companyWebsite,
    solution,
    researchTarget,
    researchWebsite,
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
      const targetUrl = "/api/generate";
      console.log("[HomeContainer] 🔗 Target URL:", targetUrl);
      console.log("[HomeContainer] 📤 Payload:", {
        company,
        companyWebsite,
        solution,
        researchTarget,
        researchWebsite,
      });
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesRepCompany: company,
          salesRepWebsite: companyWebsite,
          solution,
          targetCompany: researchTarget,
          targetWebsite: researchWebsite,
        }),
      });

      if (!response.ok) {
        console.error("[HomeContainer] ❌ Response not OK:", {
          status: response.status,
          statusText: response.statusText,
        });
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate insights");
      }

      push({
        title: "Insights ready!",
        description: "Redirecting to the dashboard now.",
        variant: "success",
      });

      router.push("/admin");
    } catch (error) {
      console.error("[HomeContainer] Failed to generate tiles", error);
      push({
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few moments.",
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
        throw new Error("Could not reset the workspace");
      }
      push({
        title: "Workspace cleared",
        description: "Submit the form again to generate a fresh workspace.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Reset failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few moments.",
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
