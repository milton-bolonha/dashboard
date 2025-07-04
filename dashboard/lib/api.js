/**
 * Wrapper para a API Fetch que injeta automaticamente o workspaceId e, opcionalmente, o token de autenticação.
 *
 * @param {string} url - A URL do endpoint da API.
 * @param {object} options - As opções padrão do fetch (method, headers, body, etc.).
 * @param {string|null} authToken - O token de autenticação opcional do Clerk.
 * @returns {Promise<Response>} - A promessa da resposta do fetch.
 */
export async function fetchWithWorkspace(url, options = {}, authToken = null) {
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
  }

  // Adicionar o token de autenticação se fornecido
  if (authToken) {
    headers.append("Authorization", `Bearer ${authToken}`);
  }

  console.log(`🚀 API Call to ${url}`, {
    method: options.method || "GET",
    withWorkspace: !!workspaceId,
    withAuth: !!authToken,
  });

  // Montar as novas opções do fetch
  const newOptions = {
    ...options,
    headers,
  };

  // Chamar o fetch original
  return fetch(url, newOptions);
}

/**
 * Wrapper específico para chamadas que exigem autenticação.
 * Garante que o token seja passado.
 */
export async function fetchWithAuth(url, authToken, options = {}) {
  if (!authToken) {
    throw new Error("fetchWithAuth requires an authToken.");
  }
  return fetchWithWorkspace(url, options, authToken);
}
