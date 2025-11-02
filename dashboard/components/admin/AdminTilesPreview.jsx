"use client";
import { useEffect, useMemo, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

export default function AdminTilesPreview() {
  const params = useMemo(
    () =>
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      ),
    []
  );
  const jobId = params.get("job_id");
  const guestId = params.get("guest_id");
  const token = params.get("token");

  const [mounted, setMounted] = useState(false);
  const [tiles, setTiles] = useState([]);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    remaining: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const streamUrl = jobId
    ? `/api/streams/jobs/${jobId}${guestId ? `?guest_id=${guestId}` : ""}${
        token ? `${guestId ? "&" : "?"}token=${token}` : ""
      }`
    : null;

  const listeners = useMemo(
    () => ({
      "job:status": (data) => {
        console.debug("[TilesPreview] job:status", data);
        if (data?.progress?.total && tiles.length === 0) {
          const total = data.progress.total;
          setTiles(
            Array.from({ length: total }, (_v, i) => ({
              orderIndex: i,
              status: "loading",
              content: null,
            }))
          );
        }
        if (data?.progress) {
          setProgress({
            current: data.progress.current ?? 0,
            total: data.progress.total ?? tiles.length,
            remaining:
              data.progress.remaining ??
              Math.max(
                (data.progress.total ?? 0) - (data.progress.current ?? 0),
                0
              ),
          });
        }
      },
      "job:result-completed": (data) => {
        console.debug("[TilesPreview] job:result-completed", data);
        if (typeof data?.orderIndex === "number") {
          setTiles((prev) => {
            const next = prev.slice();
            const oi = data.orderIndex;
            next[oi] = { orderIndex: oi, status: "done", content: data.result };
            return next;
          });
        }
      },
    }),
    [tiles.length]
  );

  const { isConnected } = useSSE(streamUrl, listeners);
  useEffect(() => {
    if (streamUrl) {
      console.debug(
        "[TilesPreview] SSE streamUrl",
        streamUrl,
        "connected=",
        isConnected
      );
    }
  }, [streamUrl, isConnected]);

  if (!mounted || !jobId) return null;

  return (
    <div className="admin-tiles-preview">
      <div className="progress mb-2">
        <span>
          {progress.current}/{progress.total}
        </span>
        {typeof progress.remaining === "number" && (
          <span> • remaining: {progress.remaining}</span>
        )}
      </div>
      <div className="tiles-grid">
        {tiles.map((t) => (
          <div key={t.orderIndex} className={`tile ${t.status}`}>
            {t.status === "loading" ? "Generating Insights..." : t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
