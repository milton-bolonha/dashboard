"use client";
// Server-first: este contêiner trocará por Server Component quando as Server Actions forem integradas.
import { useMemo, useState, useCallback } from "react";

export default function IAFormsContainer({
  mode = "landing",
  heroType = 1,
  themeId,
  initialItems,
  initialTemplateId,
  children,
}) {
  const [jobId, setJobId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [token, setToken] = useState(null);
  const scope = mode === "landing" ? "home" : "admin";
  const [running, setRunning] = useState(false);
  const [itemsBuilder, setItemsBuilder] = useState(null);
  const setItemsBuilderStable = useCallback((fn) => {
    setItemsBuilder(() => fn);
  }, []);

  async function handleRun() {
    const gid =
      guestId || `guest_${crypto?.randomUUID?.() || Date.now().toString(36)}`;
    setGuestId(gid);
    if (!initialTemplateId) {
      console.error("[IAFormsContainer] ❌ initialTemplateId não definido!");
      return;
    }
    const tok =
      token || `tok_${crypto?.randomUUID?.() || Date.now().toString(36)}`;
    setToken(tok);
    setRunning(true); // ⭐ Modal fica aberto (não fecha até redirect)

    // ⭐ CORREÇÃO CRÍTICA: itemsBuilder é uma função que retorna uma função
    // setItemsBuilder(() => () => { ... }) cria uma função que retorna outra função
    let itemsPayload = [];

    if (typeof itemsBuilder === "function") {
      try {
        // itemsBuilder() retorna a função interna que constrói os items
        const builderFn = itemsBuilder();
        if (typeof builderFn === "function") {
          itemsPayload = builderFn(); // Executar a função interna
          console.log(
            "[IAFormsContainer] ✅ itemsBuilder executado com sucesso"
          );
          console.log(
            "[IAFormsContainer] 📋 Items gerados:",
            itemsPayload.length,
            "items"
          );
        } else {
          console.warn(
            "[IAFormsContainer] ⚠️ itemsBuilder não retornou função:",
            typeof builderFn
          );
          itemsPayload = Array.isArray(initialItems) ? initialItems : [];
        }
      } catch (err) {
        console.error(
          "[IAFormsContainer] ❌ Erro ao executar itemsBuilder:",
          err
        );
        itemsPayload = Array.isArray(initialItems) ? initialItems : [];
      }
    } else {
      console.warn(
        "[IAFormsContainer] ⚠️ itemsBuilder não é função:",
        typeof itemsBuilder
      );
      itemsPayload = Array.isArray(initialItems) ? initialItems : [];
    }

    // ⭐ CORREÇÃO CRÍTICA: Se itemsPayload está vazio ou só tem orderIndex,
    // significa que o builder não capturou os valores. Neste caso, não prosseguir.
    if (
      itemsPayload.length === 0 ||
      (itemsPayload.length > 0 &&
        Object.keys(itemsPayload[0] || {}).every((key) => key === "orderIndex"))
    ) {
      console.error("[IAFormsContainer] ❌ ========== ERRO CRÍTICO ==========");
      console.error(
        "[IAFormsContainer] ❌ Items payload está vazio ou inválido!"
      );
      console.error(
        "[IAFormsContainer] ❌ itemsBuilder type:",
        typeof itemsBuilder
      );
      console.error(
        "[IAFormsContainer] ❌ itemsPayload:",
        JSON.stringify(itemsPayload, null, 2)
      );
      console.error(
        "[IAFormsContainer] ❌ ======================================"
      );
      setRunning(false);
      return; // ⭐ NÃO prosseguir se não há dados válidos
    }

    // ⭐ DEBUG COMPLETO: Log detalhado do payload
    console.log("[IAFormsContainer] 📋 ========== PAYLOAD DEBUG ==========");
    console.log("[IAFormsContainer] 📋 Items payload completo:", itemsPayload);
    console.log(
      "[IAFormsContainer] 📋 Items payload length:",
      itemsPayload.length
    );
    console.log(
      "[IAFormsContainer] 📋 itemsBuilder type:",
      typeof itemsBuilder
    );

    if (itemsPayload.length > 0) {
      const firstItem = itemsPayload[0];
      console.log("[IAFormsContainer] 📋 Primeiro item completo:", firstItem);
      console.log(
        "[IAFormsContainer] 📋 Campos do primeiro item:",
        Object.keys(firstItem)
      );
      console.log(
        "[IAFormsContainer] 📋 Valores do primeiro item (JSON):",
        JSON.stringify(firstItem, null, 2)
      );

      // Verificar campos críticos
      const criticalFields = [
        "researchTarget",
        "company",
        "name",
        "solution",
        "researchWebsite",
        "companyWebsite",
      ];
      const missingFields = criticalFields.filter(
        (field) => !firstItem[field] || firstItem[field] === ""
      );
      if (missingFields.length > 0) {
        console.warn(
          "[IAFormsContainer] ⚠️ Campos faltando no primeiro item:",
          missingFields
        );
      } else {
        console.log(
          "[IAFormsContainer] ✅ Todos os campos críticos presentes!"
        );
      }
    } else {
      console.error("[IAFormsContainer] ❌ Items payload está VAZIO!");
      console.error("[IAFormsContainer] ❌ itemsBuilder:", typeof itemsBuilder);
      console.error("[IAFormsContainer] ❌ initialItems:", initialItems);
      setRunning(false);
      return;
    }
    console.log("[IAFormsContainer] 📋 ======================================");

    // ⭐ CORREÇÃO: Usar executeRunFlow para evitar duplicação de código
    executeRunFlow(itemsPayload);
  }

  // ⭐ Extrair lógica de execução do run para reutilizar (declarado antes de handleRunWithItems)
  const executeRunFlow = useCallback(
    async (itemsPayload) => {
      try {
        console.log("[IAFormsContainer v2.0] 🚀 Iniciando Fluxo 2.0...");

        // Extrair o primeiro item para criar o contexto
        const firstItem = itemsPayload[0] || {};
        const context = {
          themeId: themeId,
          target:
            firstItem.researchTarget ||
            firstItem.company ||
            firstItem.name ||
            "Preview",
          targetWebsite:
            firstItem.researchWebsite ||
            firstItem.companyWebsite ||
            firstItem.website ||
            "",
          solution: firstItem.solution || "N/A",
        };

        // ⭐ PASSO ÚNICO: Criar job, workspace e iniciar em background
        const createRes = await fetch("/api/prompt-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: initialTemplateId,
            model: "o4-mini",
            context: context,
          }),
        });

        if (!createRes.ok) {
          const errorData = await createRes.json().catch(() => ({}));
          console.error(
            "[IAFormsContainer v2.0] ❌ Erro ao criar job e workspace:",
            errorData
          );
          setRunning(false);
          return;
        }

        // A resposta agora contém jobId, guestId e token
        const {
          jobId: newJobId,
          guestId: newGuestId,
          token: newToken,
        } = await createRes.json();
        console.log(
          `[IAFormsContainer v2.0] ✅ Job e Workspace criados: JobID=${newJobId}, GuestID=${newGuestId}, Token=${
            newToken ? "***" : "N/A"
          }`
        );
        setJobId(newJobId);
        setGuestId(newGuestId);

        // ⭐ REDIRECIONAMENTO IMEDIATO
        const qp = new URLSearchParams();
        qp.set("job_id", newJobId);
        qp.set("guest_id", newGuestId);
        if (newToken) {
          qp.set("token", newToken);
        }

        window.location.href = `/admin?${qp.toString()}`;
      } catch (err) {
        console.error(
          "[IAFormsContainer v2.0] ❌ Erro no executeRunFlow:",
          err
        );
        setRunning(false);
      }
    },
    [initialTemplateId, themeId, setJobId, setGuestId, setRunning, token]
  );

  // ⭐ NOVO: Função para executar o run com valores diretos
  const handleRunWithItems = useCallback(
    (directItems) => {
      // Se items foram passados diretamente, usar eles em vez do itemsBuilder
      if (directItems && Array.isArray(directItems) && directItems.length > 0) {
        console.log(
          "[IAFormsContainer] 📦 Usando items passados diretamente:",
          directItems.length
        );
        // Criar uma função handleRun modificada que usa os items diretos
        setRunning(true);

        // Continuar com o fluxo normal usando directItems
        executeRunFlow(directItems);
      } else {
        // Fallback para o fluxo normal com itemsBuilder
        handleRun();
      }
    },
    [guestId, token, initialTemplateId, executeRunFlow, handleRun]
  );

  const presenterProps = useMemo(
    () => ({
      theme: { id: themeId },
      onRun: handleRun,
      onRunWithItems: handleRunWithItems, // ⭐ NOVO: Versão que aceita items diretamente
      onPause: async () =>
        jobId &&
        fetch(`/api/prompt-jobs/${jobId}/pause`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        }),
      onResume: async () =>
        jobId &&
        fetch(`/api/prompt-jobs/${jobId}/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        }),
      onCancel: async () =>
        jobId &&
        fetch(`/api/prompt-jobs/${jobId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        }),
      jobId,
      scope,
      getStreamUrl: () =>
        jobId
          ? `/api/streams/jobs/${jobId}${
              guestId ? `?guest_id=${guestId}` : ""
            }${token ? `${guestId ? "&" : "?"}token=${token}` : ""}`
          : null,
      isRunning: running,
      setItemsBuilder: setItemsBuilderStable,
    }),
    [
      jobId,
      scope,
      themeId,
      guestId,
      token,
      running,
      setItemsBuilderStable,
      handleRunWithItems,
    ]
  );

  return typeof children === "function" ? children(presenterProps) : null;
}
