"use client";

import { useMemo, useState } from "react";

import { useToast } from "@/lib/state/toast-context";

interface HomeFormProps {
  onSubmit: (payload: {
    companyName: string;
    companyWebsite: string;
    solution: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export function HomeForm({ onSubmit, isSubmitting }: HomeFormProps) {
  const { push } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [solution, setSolution] = useState("Mentorship Career Program");

  const isValid = useMemo(() => {
    return companyName.trim().length > 1 && companyWebsite.trim().length > 4;
  }, [companyName, companyWebsite]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      push({
        title: "Preencha os campos obrigatórios",
        description: "Informe a empresa e um site válido antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    await onSubmit({
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim(),
      solution: solution.trim() || "Mentorship Career Program",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur"
    >
      <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">
            Empresa alvo
          </span>
          <input
            required
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Ex: Upwork"
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">
            Website oficial
          </span>
          <input
            required
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
            placeholder="https://empresa.com"
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>

        <label className="md:col-span-2 flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-300">
            Solução que você quer vender
          </span>
          <input
            value={solution}
            onChange={(event) => setSolution(event.target.value)}
            placeholder="Mentorship Career Program"
            className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/30"
          />
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-400">
          O fluxo gera 8 insights estratégicos sobre a empresa, incluindo
          prioridades, desafios e abordagem sugerida. Tudo salvo em cookies.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Gerando insights..." : "Gerar insights"}
        </button>
      </div>
    </form>
  );
}

