"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Maximize2,
  Paperclip,
  ArrowUp,
  Save,
  FileText,
  Bot,
  Info,
} from "lucide-react";
import Image from "next/image";

const AIMessage = ({ content }) => {
  // Processar markdown para HTML estilizado
  const processContent = (text) => {
    if (!text) return text;

    let processed = text;

    // 1. Processar headings (## Title)
    processed = processed.replace(
      /^### (.+)$/gm,
      "<h3 class='text-lg font-bold text-gray-900 mt-6 mb-3'>$1</h3>"
    );
    processed = processed.replace(
      /^## (.+)$/gm,
      "<h2 class='text-xl font-bold text-gray-900 mt-8 mb-4'>$1</h2>"
    );
    processed = processed.replace(
      /^# (.+)$/gm,
      "<h1 class='text-2xl font-bold text-gray-900 mt-8 mb-5'>$1</h1>"
    );

    // 2. Processar negrito e itálico
    processed = processed.replace(
      /\*\*(.+?)\*\*/g,
      "<strong class='font-bold text-gray-900'>$1</strong>"
    );
    processed = processed.replace(
      /\*(.+?)\*/g,
      "<em class='italic text-gray-700'>$1</em>"
    );

    // 3. Processar listas não ordenadas (detectar blocos inteiros)
    processed = processed.replace(/(?:^[\*\-]\s+(.+)$\n?)+/gm, (match) => {
      const items = match
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[\*\-]\s+/, ""))
        .map((item) => `<li class='mb-2 pl-2 text-gray-700'>${item}</li>`)
        .join("");
      return `<ul class='list-disc list-outside ml-6 my-4 space-y-1'>${items}</ul>`;
    });

    // 4. Processar listas numeradas
    processed = processed.replace(/(?:^\d+\.\s+(.+)$\n?)+/gm, (match) => {
      const items = match
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s+/, ""))
        .map((item) => `<li class='mb-2 pl-2 text-gray-700'>${item}</li>`)
        .join("");
      return `<ol class='list-decimal list-outside ml-6 my-4 space-y-1'>${items}</ol>`;
    });

    // 5. Processar parágrafos (linhas vazias)
    processed = processed
      .split("\n\n")
      .map((para) => {
        para = para.trim();
        if (!para) return "";
        if (para.startsWith("<")) return para; // Já é HTML
        return `<p class='mb-4 leading-[1.7] text-gray-700'>${para.replace(
          /\n/g,
          "<br/>"
        )}</p>`;
      })
      .join("");

    return processed;
  };

  return (
    <div className="group">
      {/* Icon + Actions Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 rounded-full p-2">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-600">
            AI Assistant
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Save className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <FileText className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content - Formato Blog */}
      <article
        className="prose prose-gray max-w-none text-[15px] text-gray-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processContent(content) }}
      />
    </div>
  );
};

const MetricsInfo = ({ metrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metrics || !metrics.total_duration_ms) return null;

  const duration = metrics.total_duration_ms;
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Identificar gargalo principal
  let bottleneckName = "unknown";
  let bottleneckTime = 0;
  if (metrics.breakdown) {
    const bottleneck = Object.entries(metrics.breakdown).sort(
      ([, a], [, b]) => b - a
    )[0];
    bottleneckName = bottleneck ? bottleneck[0].replace("_ms", "") : "unknown";
    bottleneckTime = bottleneck ? bottleneck[1] : 0;
  }

  // Mapear gargalos para labels mais claros
  const bottleneckLabels = {
    api_call: "OpenAI API",
    ttft: "First token",
    db_save: "Database save",
    streaming: "Streaming",
    queue_wait: "Queue wait",
  };

  const bottleneckLabel = bottleneckLabels[bottleneckName] || bottleneckName;

  return (
    <div className="bg-gray-50 rounded-lg p-3 mt-4 border border-gray-200">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Info className="w-4 h-4" />
          <span className="font-medium">Performance Details</span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDuration(duration)} • {bottleneckLabel} took{" "}
          {formatDuration(bottleneckTime)}
        </div>
        <div className="text-gray-400">{isExpanded ? "▼" : "▶"}</div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
            <div>
              <span className="text-gray-500">Total time:</span>
              <span className="ml-1 font-medium">
                {formatDuration(duration)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Model:</span>
              <span className="ml-1 font-medium">
                {metrics.model || "gpt-4o-mini"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Slowest step:</span>
              <span className="ml-1 font-medium">{bottleneckLabel}</span>
            </div>
            <div>
              <span className="text-gray-500">Step time:</span>
              <span className="ml-1 font-medium">
                {formatDuration(bottleneckTime)}
              </span>
            </div>
          </div>

          {/* Breakdown detalhado */}
          {metrics.breakdown && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">Breakdown:</div>
              <div className="space-y-1">
                {Object.entries(metrics.breakdown).map(([key, value]) => {
                  const label =
                    bottleneckLabels[key.replace("_ms", "")] ||
                    key.replace("_ms", "");
                  const percentage = ((value / duration) * 100).toFixed(1);
                  return (
                    <div
                      key={key}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600">{label}:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs w-12 text-right">
                          {formatDuration(value)} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pipeline metrics */}
          {metrics.pipeline && (
            <div className="mb-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Pipeline:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loading time:</span>
                  <span className="text-gray-500">
                    {formatDuration(metrics.pipeline.loading_ms || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing:</span>
                  <span className="text-gray-500">
                    {formatDuration(metrics.pipeline.processing_ms || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">UI update:</span>
                  <span className="text-gray-500">
                    {formatDuration(metrics.pipeline.ui_update_ms || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tokens info */}
          {metrics.tokens && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Tokens used:</div>
              <div className="flex gap-4 text-xs">
                <span>Prompt: {metrics.tokens.prompt || 0}</span>
                <span>Completion: {metrics.tokens.completion || 0}</span>
                <span className="font-medium">
                  Total: {metrics.tokens.total || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function DocModal({ isOpen, onClose, tile }) {
  if (!isOpen || !tile) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-[55%] bg-white shadow-2xl z-50 flex flex-col rounded-l-[16px] border-l border-[#bababa]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- Header --- */}
            <div className="flex-shrink-0 h-[72px] px-6 flex items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src="/images/back.svg"
                    width={20}
                    height={20}
                    alt="Back"
                  />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Image
                    src="/images/collapse.svg"
                    width={20}
                    height={20}
                    alt="Collapse"
                  />
                </button>
              </div>
              <h2 className="text-[24px] font-semibold text-gray-800 ml-6">
                {tile.title}
              </h2>
            </div>

            {/* --- Chat Area (Scrollable) --- */}
            <div className="flex-grow px-8 py-8 overflow-y-auto bg-white space-y-8">
              {/* User Question (Prompt) */}
              <div className="flex justify-end">
                <div className="bg-gray-200 rounded-2xl px-4 py-3 max-w-lg">
                  <p className="text-sm text-gray-800">{tile.question}</p>
                </div>
              </div>

              {/* AI Response - Formato Blog */}
              <div>
                <AIMessage content={tile.answer} />
                {tile.metrics && <MetricsInfo metrics={tile.metrics} />}
              </div>

              {/* Example of user question */}
              {/*
              <div className="flex justify-end">
                <div className="bg-gray-200 rounded-xl px-4 py-3 max-w-lg">
                    <p className="text-sm text-gray-800">What countries specifically are they making revenue from?</p>
                </div>
              </div>
              */}
            </div>

            {/* --- Input Bar (Footer) --- */}
            <div className="flex-shrink-0 bg-white px-4 py-3">
              <div className="relative">
                <textarea
                  placeholder="Ask more..."
                  className="w-full min-h-[96px] resize-none rounded-xl border border-gray-300 py-3 pl-4 pr-16 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                />
                <div className="absolute right-3 bottom-3 flex items-center space-x-1">
                  <button
                    onClick={() =>
                      console.log("📎 Anexar arquivo ao tile:", tile?.id)
                    }
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() =>
                      console.log("📤 Enviar mensagem para tile:", tile?.id)
                    }
                    className="bg-black text-white rounded-full p-1.5 hover:bg-gray-800 transition-colors"
                    title="Enviar mensagem"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
