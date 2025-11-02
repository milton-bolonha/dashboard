import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import HeroPresenter from "@/components/landing/hero/HeroPresenter";
import { useHeroValidation } from "@/components/landing/shared/useHeroValidation";
import { useHeroInputStates } from "@/components/landing/shared/useHeroInputStates";

export default function IAFormsPresenterClassic(props) {
  const {
    onRun,
    onRunWithItems, // ⭐ NOVO: Versão que aceita items diretamente
    onPause,
    onResume,
    onCancel,
    jobId,
    getStreamUrl,
    setItemsBuilder,
  } = props;
  const [tiles, setTiles] = useState([]);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    remaining: 0,
  });
  const fields = [
    "company",
    "companyWebsite",
    "solution",
    "researchTarget",
    "researchWebsite",
  ];
  const { validateInput } = useHeroValidation();
  const {
    inputs,
    inputStates,
    updateInputState,
    setInputFocus,
    allValid,
    setInputs,
    setInputStates,
  } = useHeroInputStates(fields, validateInput);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const canEnableInput = (name) => {
    if (name === "companyWebsite") return inputStates.company?.isValid;
    if (name === "solution") return inputStates.companyWebsite?.isValid;
    if (name === "researchTarget") return inputStates.solution?.isValid;
    if (name === "researchWebsite") return inputStates.researchTarget?.isValid;
    return true;
  };
  const handleInputChange = (name, val) => {
    const type = name.toLowerCase().includes("website") ? "url" : "text";
    updateInputState(name, val, type);
  };
  const handleInputFocus = (name) => {
    setInputFocus(name, true);
  };
  const handleInputBlur = (name) => {
    setInputFocus(name, false);
  };
  const handleKeyDown = (_name, e) => {
    if (e.key === "Enter" && allValid && !creating) handleAction();
  };
  const handleAction = async () => {
    setError(null);
    if (!allValid) {
      console.warn(
        "[IAFormsPresenterClassic] ⚠️ Formulário inválido, não submetendo"
      );
      return;
    }

    // ⭐ DEBUG: Log dos inputs antes de submeter
    console.log(
      "[IAFormsPresenterClassic] 🚀 ========== SUBMIT INICIADO =========="
    );
    console.log("[IAFormsPresenterClassic] 🚀 Inputs atuais:", inputs);
    console.log("[IAFormsPresenterClassic] 🚀 InputStates:", inputStates);
    console.log("[IAFormsPresenterClassic] 🚀 AllValid:", allValid);

    // ⭐ CORREÇÃO CRÍTICA: Atualizar itemsBuilder COM OS VALORES ATUAIS antes de chamar onRun
    // Isso garante que quando o builder for executado, tenha os valores mais recentes
    if (typeof setItemsBuilder === "function") {
      console.log(
        "[IAFormsPresenterClassic] 🔄 Atualizando itemsBuilder com valores atuais antes do submit..."
      );
      setItemsBuilder(() => () => {
        // Closure captura valores atuais do momento do submit
        const currentInputs = { ...inputs };
        console.log(
          "[IAFormsPresenterClassic] 📝 Builder executado com valores:",
          JSON.stringify(currentInputs, null, 2)
        );

        // Verificar se há dados válidos
        const hasData = Object.values(currentInputs).some(
          (val) => val && val.trim && val.trim().length > 0
        );
        if (!hasData) {
          console.warn(
            "[IAFormsPresenterClassic] ⚠️ Inputs vazios ao criar items!"
          );
        }

        // Retornar array com 8 items, cada um com os valores atuais
        return Array.from({ length: 8 }, (_v, i) => ({
          orderIndex: i,
          ...currentInputs, // ⭐ Spread dos valores atuais
        }));
      });
    }

    setCreating(true); // ⭐ Modal abre e NÃO fecha até redirect

    try {
      // ⭐ CORREÇÃO CRÍTICA: Construir items diretamente aqui e passar para onRun
      // Isso garante que os valores atuais sejam usados, sem depender do itemsBuilder assíncrono
      const currentInputs = { ...inputs };
      console.log(
        "[IAFormsPresenterClassic] 🚀 Construindo items diretamente com valores:",
        JSON.stringify(currentInputs, null, 2)
      );

      // Verificar se há dados válidos
      const hasData = Object.values(currentInputs).some(
        (val) => val && typeof val === "string" && val.trim().length > 0
      );

      if (!hasData) {
        console.error(
          "[IAFormsPresenterClassic] ❌ Inputs vazios! Não é possível prosseguir."
        );
        setError("Por favor, preencha todos os campos antes de continuar.");
        setCreating(false);
        return;
      }

      // Construir items diretamente
      const directItems = Array.from({ length: 8 }, (_v, i) => ({
        orderIndex: i,
        ...currentInputs, // ⭐ Spread dos valores atuais
      }));

      console.log(
        "[IAFormsPresenterClassic] 📦 Items construídos diretamente:",
        directItems.length,
        "items com",
        Object.keys(currentInputs).length,
        "campos cada"
      );
      console.log(
        "[IAFormsPresenterClassic] 📦 Primeiro item:",
        JSON.stringify(directItems[0], null, 2)
      );

      // ⭐ Usar onRunWithItems se disponível (mais confiável), senão usar onRun normal
      if (props.onRunWithItems && typeof props.onRunWithItems === "function") {
        console.log(
          "[IAFormsPresenterClassic] 🚀 Usando onRunWithItems (modo direto)..."
        );
        await props.onRunWithItems(directItems);
      } else {
        console.log("[IAFormsPresenterClassic] 🚀 Usando onRun padrão...");
        // Atualizar itemsBuilder antes de chamar onRun
        if (typeof setItemsBuilder === "function") {
          setItemsBuilder(() => () => directItems);
        }
        await new Promise((resolve) => setTimeout(resolve, 50)); // Aguardar um pouco mais
        await onRun?.();
      }
      // ⭐ NÃO setar creating=false aqui - modal deve permanecer até redirect
      // O redirect acontece dentro de onRun, então o componente será desmontado
    } catch (err) {
      console.error("[IAFormsPresenterClassic] ❌ Erro ao iniciar:", err);
      setError(err?.message || "Erro ao iniciar");
      setCreating(false); // ⭐ Só fecha modal se houver erro
    }
    // ⭐ NÃO finally aqui - se sucesso, redirect vai desmontar componente
  };

  useEffect(() => {
    if (typeof setItemsBuilder === "function") {
      // ⭐ CORREÇÃO: Builder sempre pega valores ATUAIS do estado quando chamado
      setItemsBuilder(() => () => {
        // Usar closure para pegar valores atuais no momento da chamada
        const currentInputs = { ...inputs };
        console.log(
          "[IAFormsPresenterClassic] 📝 Criando items com base (valores atuais):",
          currentInputs
        );
        console.log(
          "[IAFormsPresenterClassic] 📝 Campos disponíveis:",
          Object.keys(currentInputs)
        );
        console.log(
          "[IAFormsPresenterClassic] 📝 Valores completos:",
          JSON.stringify(currentInputs, null, 2)
        );

        // Verificar se há dados válidos
        const hasData = Object.values(currentInputs).some(
          (val) => val && val.trim().length > 0
        );
        if (!hasData) {
          console.warn(
            "[IAFormsPresenterClassic] ⚠️ Inputs vazios ao criar items!"
          );
        }

        // ⭐ CORREÇÃO: Template tem 8 tiles, não 6!
        return Array.from({ length: 8 }, (_v, i) => ({
          orderIndex: i,
          ...currentInputs, // ⭐ Spread dos valores atuais
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputs.company,
    inputs.companyWebsite,
    inputs.solution,
    inputs.researchTarget,
    inputs.researchWebsite,
    setItemsBuilder,
  ]);

  const listeners = useMemo(
    () => ({
      "job:status": (data) => {
        if (data?.progress?.total && tiles.length === 0) {
          const total = data.progress.total;
          setTiles(
            Array.from({ length: total }, (_v, i) => ({
              orderIndex: i,
              status: "loading",
              content: null,
            }))
          );
        }
        if (data?.progress) {
          setProgress({
            current: data.progress.current ?? 0,
            total: data.progress.total ?? tiles.length,
            remaining:
              data.progress.remaining ??
              Math.max(
                (data.progress.total ?? 0) - (data.progress.current ?? 0),
                0
              ),
          });
        }
      },
      "job:result-completed": (data) => {
        if (typeof data?.orderIndex === "number") {
          setTiles((prev) => {
            const next = prev.slice();
            const oi = data.orderIndex;
            next[oi] = {
              orderIndex: oi,
              status: "done",
              content: data.result,
            };
            return next;
          });
        }
      },
    }),
    [tiles.length]
  );
  const streamUrl =
    jobId && typeof getStreamUrl === "function" ? getStreamUrl() : null;
  useSSE(streamUrl, listeners);
  return (
    <div className="iaforms-classic">
      <HeroPresenter
        inputs={inputs}
        inputStates={inputStates}
        creating={creating}
        error={error}
        allValid={allValid}
        styleMode="default"
        canEnableInput={canEnableInput}
        handleInputChange={handleInputChange}
        handleInputFocus={handleInputFocus}
        handleInputBlur={handleInputBlur}
        handleAction={handleAction}
        handleKeyDown={handleKeyDown}
      />
      <div className="progress">
        <span>
          {progress.current}/{progress.total}
        </span>
        {typeof progress.remaining === "number" && (
          <span> • remaining: {progress.remaining}</span>
        )}
      </div>
      <div className="tiles-grid">
        {tiles.map((t) => (
          <div key={t.orderIndex} className={`tile ${t.status}`}>
            {t.status === "loading" ? "Generating Insights..." : t.content}
          </div>
        ))}
      </div>
      <div className="controls hidden">
        {/* controles mantidos pelo HeroPresenter */}
      </div>
    </div>
  );
}
