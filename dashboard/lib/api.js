/**
 * Wrapper para a API Fetch que injeta automaticamente o workspaceId.
 * Isso garante que todas as chamadas de API sejam contextuais ao workspace ativo.
 *
 * @param {string} url - A URL do endpoint da API.
 * @param {object} options - As opções padrão do fetch (method, headers, body, etc.).
 * @returns {Promise<Response>} - A promessa da resposta do fetch.
 */
export async function fetchWithWorkspace(url, options = {}) {
  // Obter o workspaceId do localStorage
  const workspaceId =
    typeof window !== "undefined"
      ? localStorage.getItem("currentWorkspaceId")
      : null;

  // Clonar headers existentes ou criar um novo objeto
  const headers = new Headers(options.headers || {});

  // Adicionar o header do workspace se ele existir
  if (workspaceId) {
    headers.append("x-workspace-id", workspaceId);
    console.log(`🚀 API Call to ${url} with workspace: ${workspaceId}`);
  } else {
    console.warn(`⚠️ API Call to ${url} without workspaceId.`);
  }

  // Montar as novas opções do fetch
  const newOptions = {
    ...options,
    headers,
  };

  // Chamar o fetch original
  return fetch(url, newOptions);
}
