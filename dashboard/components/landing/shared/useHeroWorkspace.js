import { useState } from "react";

export function useHeroWorkspace() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const createGuestWorkspace = async (themeId, context) => {
    setCreating(true);
    setError(null);

    try {
      const guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      document.cookie = `guest_id=${guestId}; Path=/; Max-Age=604800; SameSite=Lax`;
      localStorage.setItem("onboarding_context", JSON.stringify(context));

      const response = await fetch("/api/guest/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, context }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.redirect) {
          window.location.href = "/admin";
          return;
        }
        throw new Error(data.error || "Failed to create workspace");
      }

      // Preload tiles (non-blocking)
      if (themeId === "sales-assistant") {
        fetch("/api/guest/preload-tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId, tilesCount: 2 }),
        }).catch(() => {});
      }

      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { creating, error, createGuestWorkspace, setError };
}
