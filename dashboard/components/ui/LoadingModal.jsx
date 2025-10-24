"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

export default function LoadingModal({ isOpen, onAccept, companyName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
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
            📊 Tiles will appear as they're generated
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onAccept}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Got it, let's go!
        </button>
      </motion.div>
    </div>
  );
}
