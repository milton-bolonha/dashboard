export function HomeHero() {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-12 pt-16 text-center text-slate-100 md:pt-24">
      <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 shadow shadow-cyan-500/10">
        OpenAI Insights
      </span>
      <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl">
        Gere análises instantâneas para qualquer empresa em segundos.
      </h1>
      <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-slate-300 md:text-lg">
        Defina a empresa-alvo, cole o site e escolha a proposta de valor. Nós cuidamos das perguntas inteligentes e salvamos tudo em cookies — perfeito para MVPs rápidos no Netlify.
      </p>
    </header>
  );
}

