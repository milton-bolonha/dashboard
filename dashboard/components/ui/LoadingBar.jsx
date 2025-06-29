"use client";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function LoadingBar() {
  const { loading } = useWorkspace();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsVisible(true);
      setProgress(0);

      // Simular progresso de carregamento
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Parar em 90% até carregar completamente
          }
          return prev + Math.random() * 30;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Completar a barra e esconder
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 500);
    }
  }, [loading]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 h-1">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: progress > 0 ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20" />
    </div>
  );
}
