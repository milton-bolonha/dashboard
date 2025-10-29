"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Database, Bot, Rocket } from "lucide-react";

const MESSAGES = [
  {
    icon: Database,
    text: "Creating your workspace instance...",
    color: "blue",
  },
  {
    icon: Bot,
    text: "Connecting to AI engine...",
    color: "purple",
  },
  {
    icon: Rocket,
    text: "Generating your insights...",
    color: "orange",
  },
  {
    icon: Sparkles,
    text: "Almost ready!",
    color: "yellow",
  },
];

export default function AutoLoadingModal({ isOpen, delay = 2000 }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= MESSAGES.length - 1) return prev;
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isOpen, delay]);

  if (!isOpen) return null;

  const currentMessage = MESSAGES[currentMessageIndex];
  const Icon = currentMessage.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
        >
          {/* Icon com rotação */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className={`w-20 h-20 bg-${currentMessage.color}-100 rounded-full flex items-center justify-center`}
              >
                <Icon
                  className={`w-10 h-10 text-${currentMessage.color}-600`}
                />
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

          {/* Mensagem com fade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-gray-900 mb-4">
                {currentMessage.text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"
              initial={{ width: "0%" }}
              animate={{
                width: `${
                  ((currentMessageIndex + 1) / MESSAGES.length) * 100
                }%`,
              }}
              transition={{ duration: delay / 1000 }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
