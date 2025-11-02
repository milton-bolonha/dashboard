"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

// ⭐ MELHORIA: Memoizado para evitar re-renderizações desnecessárias
const LoadingModal = memo(function LoadingModal({
  isOpen,
  onAccept,
  onCancel,
  companyName,
  progress, // { current, total, remaining }
}) {
  // ⭐ MELHORIA: Early return se não estiver aberto
  if (!isOpen) return null;

  // ⭐ MELHORIA: Calcular progresso uma vez
  const showProgress = progress && progress.total > 0;
  const current = progress?.current || 0;
  const total = progress?.total || 0;
  const remaining = progress?.remaining;
  const hasRemaining = typeof remaining === "number";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-blue-600" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
          Generating AI Insights
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-6">
          Our AI is analyzing <strong>{companyName || "your company"}</strong>{" "}
          and generating personalized research tiles for your dashboard.
        </p>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 text-center">
            {showProgress ? (
              <>
                📊 Progress: {current}/{total}
                {hasRemaining && ` • remaining: ${remaining}`}
              </>
            ) : (
              "📊 Tiles will appear as they're generated"
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onAccept}
            className={`${
              onCancel ? "flex-1" : "w-full"
            } bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200`}
          >
            Got it, let's go!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default LoadingModal;