export async function fetcher(url, options) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    const error = new Error("Failed to fetch data");
    try {
      error.info = await response.json();
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
