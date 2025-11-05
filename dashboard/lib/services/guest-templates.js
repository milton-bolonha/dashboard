/**
 * Service layer para operações de templates do guest workspace
 */

export async function saveTemplate({ guestId, jobId, token, template }) {
  const response = await fetch("/api/guest/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      guestId,
      token,
      template,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to save template");
  }

  return response.json();
}
