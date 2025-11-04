import { useState, useEffect } from "react";

export function useJobManager(jobId, guestId) {
  const [jobInfo, setJobInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId || !guestId) {
      setJobInfo(null);
      return;
    }

    const fetchJobInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/prompt-jobs/${jobId}?guest_id=${guestId}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText || `Failed to fetch job info: ${response.statusText}`
          );
        }

        const data = await response.json();
        setJobInfo(data);
      } catch (err) {
        console.error("[useJobManager] Error fetching job info:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobInfo();
  }, [jobId, guestId]);

  return { jobInfo, loading, error };
}
