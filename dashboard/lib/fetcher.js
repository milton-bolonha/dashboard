export async function fetcher(url, options) {
  // ⭐ IMPORTANTE: Desabilitar cache do Next.js para garantir que nosso cache em memória funcione corretamente
  // No Next.js 15, fetch() não é cached por default, mas é recomendado ser explícito
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store", // Desabilitar cache do Next.js (nosso cache em memória gerencia isso)
    ...options,
  });

  if (!response.ok) {
    if (response.status === 404 && url.includes("/api/cookie/workspace")) {
      return {
        success: true,
        companies: [],
        contacts: [],
        notes: [],
        workspace: {
          name: "Trial Workspace",
          companies: [],
          contacts: [],
        },
        generatedAt: new Date().toISOString(),
      };
    }

    const error = new Error("Failed to fetch data");
    const clone = response.clone();
    try {
      error.info = await clone.json();
    } catch {
      error.info = await response.text();
    }
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
