/**
 * Service layer para operações de tiles do guest workspace
 */

import { cookieModeEnabled } from "@/lib/config/features";

export async function saveTile({ guestId, jobId, tile, entityKey }) {
  if (cookieModeEnabled) {
    // Persistência direta já é cuidada pelo backend no modo cookie.
    return { success: true };
  }

  const response = await fetch(`/api/guest/tiles?guest_id=${guestId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tile,
      jobId,
      entityKey,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to save tile");
  }

  return response.json();
}

export async function deleteTile({ guestId, jobId, token, tileId, companyId }) {
  if (cookieModeEnabled) {
    const response = await fetch(`/api/cookie/tiles/${tileId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to delete tile");
    }

    return response.json();
  }

  const response = await fetch(`/api/guest/tiles/${tileId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId,
      guestId,
      token,
      companyId,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to delete tile");
  }

  return response.json();
}

export async function reorderTiles({
  guestId,
  jobId,
  token,
  companyId,
  tilesOrder,
}) {
  if (cookieModeEnabled) {
    const response = await fetch(`/api/cookie/reorder-tiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tilesOrder }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to reorder tiles");
    }

    return response.json();
  }

  const response = await fetch(`/api/guest/reorder-tiles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jobId,
      guestId,
      token,
      companyId,
      tilesOrder,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to reorder tiles");
  }

  return response.json();
}

export async function generateCustomTile({
  guestId,
  jobId,
  token,
  companyId,
  entityKey,
  prompt,
}) {
  if (cookieModeEnabled) {
    throw new Error("Custom tile generation is not available in cookie mode yet.");
  }

  const response = await fetch("/api/guest/generate-custom-tile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId,
      guestId,
      token,
      companyId,
      entityKey,
      prompt,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to generate tile");
  }

  return response.json();
}
