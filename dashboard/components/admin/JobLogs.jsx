"use client";
import { useEffect, useState } from "react";

export default function JobLogs({ jobId }) {
  const [logs, setLogs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!jobId || loading) return;
    setLoading(true);
    try {
      const url = new URL(`/api/prompt-jobs/${jobId}/logs`, window.location.origin);
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setLogs((prev) => prev.concat(data.items || []));
        setCursor(data.nextCursor || null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLogs([]);
    setCursor(null);
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return (
    <div className="job-logs">
      <div className="log-list">
        {logs.map((l, idx) => (
          <div key={idx} className={`log-item level-${l.level || "info"}`}>
            <span className="ts">{l.ts}</span>
            <span className="lvl">[{l.level}]</span>
            <span className="msg">{l.message}</span>
          </div>
        ))}
      </div>
      <button onClick={loadMore} disabled={loading || !jobId}>
        {loading ? "Carregando..." : "Carregar mais"}
      </button>
    </div>
  );
}

