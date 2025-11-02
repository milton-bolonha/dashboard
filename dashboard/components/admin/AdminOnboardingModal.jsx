"use client";
import { useEffect, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

export default function AdminOnboardingModal() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    remaining: 0,
  });
  const [streamUrl, setStreamUrl] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const jobId = sp.get("job_id");
    const guestId = sp.get("guest_id");
    const token = sp.get("token");
    if (jobId) {
      setOpen(true);
      const qs = new URLSearchParams();
      if (guestId) qs.set("guest_id", guestId);
      if (token) qs.set("token", token);
      setStreamUrl(
        `/api/streams/jobs/${jobId}${qs.toString() ? `?${qs.toString()}` : ""}`
      );
    }
  }, []);

  // ⭐ CRÍTICO: Usar useRef para listeners estáveis (evita reconexões)
  const listenersRef = useRef(null);
  if (!listenersRef.current) {
    listenersRef.current = {
      "job:status": (data) => {
        console.debug("[OnboardingModal] 📊 job:status recebido:", data);
        const p = data?.progress || {};
        setProgress({
          current: p.current ?? 0,
          total: p.total ?? 0,
          remaining:
            p.remaining ?? Math.max((p.total ?? 0) - (p.current ?? 0), 0),
        });
        if (data?.status === "COMPLETED") {
          console.debug("[OnboardingModal] ✅ Job completado, fechando modal");
          setOpen(false);
        }
      },
    };
  }

  useSSE(streamUrl, listenersRef.current);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
        <h3 className="text-lg font-semibold mb-2">
          Configurando seu workspace (Guest)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Seu job está em execução e os tiles serão exibidos assim que chegarem.
        </p>
        <div className="text-gray-700">
          Progresso: {progress.current}/{progress.total}
          {typeof progress.remaining === "number" &&
            ` • restantes: ${progress.remaining}`}
        </div>
      </div>
    </div>
  );
}
