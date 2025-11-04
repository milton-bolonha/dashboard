import { useState, useCallback } from "react";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspaceTheme, setWorkspaceTheme] = useState(null);
  const [dashboardBackground, setDashboardBackground] = useState({
    type: "solid",
    value: "#ffffff",
  });

  const loadGuestWorkspace = useCallback(async (params = {}) => {
    const { guestId, jobId, token } = params;
    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/guest/workspace", window.location.origin);
      url.searchParams.append("_t", Date.now()); // cache buster
      if (guestId) url.searchParams.append("guest_id", guestId);
      if (jobId) url.searchParams.append("job_id", jobId);
      if (token) url.searchParams.append("token", token);

      const response = await fetch(url.toString());
      if (!response.ok) {
        // Deixar o chamador tratar o 404
        if (response.status === 404) {
          throw new Error("Workspace not found");
        }
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWorkspace(data);
      if (data.workspace?.themeSnapshot) {
        setWorkspaceTheme(data.workspace.themeSnapshot);
      }
      if (data.workspace?.dashboardBackground) {
        setDashboardBackground(data.workspace.dashboardBackground);
      }
    } catch (err) {
      setError(err.message);
      // Lançar o erro para que o orquestrador possa pegá-lo
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createGuestWorkspace = useCallback(
    async ({ guestId, context, themeId }) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/guest/workspace?guest_id=${guestId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context, themeId }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to create workspace`);
        }

        const data = await response.json();
        setWorkspace(data);
        if (data.workspace?.themeSnapshot) {
          setWorkspaceTheme(data.workspace.themeSnapshot);
        }
        if (data.workspace?.dashboardBackground) {
          setDashboardBackground(data.workspace.dashboardBackground);
        }
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    workspace,
    loading,
    error,
    workspaceTheme,
    dashboardBackground,
    loadGuestWorkspace,
    createGuestWorkspace,
    setWorkspace,
    setDashboardBackground,
  };
}
