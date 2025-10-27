"use client";

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
    <div>
      {/* Content - Formato Blog (sem header, avatar está fora) */}
      <article
        className="prose prose-gray max-w-none text-[15px] text-gray-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processContent(content) }}
      />
    </div>
  );
};

const MetricsInfo = ({ metrics }) => {
  if (!metrics) return null;

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTokens = (tokens) => {
    if (tokens < 1000) return `${tokens}`;
    return `${(tokens / 1000).toFixed(1)}k`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 text-gray-500 text-xs">
        <Info className="w-3 h-3" />
        <span className="font-medium">Estatísticas de geração:</span>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-gray-600">
        <div>
          <div className="font-medium">Duração</div>
          <div className="text-gray-500">
            {formatDuration(metrics.generation_duration_ms)}
          </div>
        </div>
        <div>
          <div className="font-medium">Tokens</div>
          <div className="text-gray-500">
            {formatTokens(metrics.tokens_used)}
          </div>
        </div>
        <div>
          <div className="font-medium">Modelo</div>
          <div className="text-gray-500 truncate">{metrics.model}</div>
        </div>
      </div>
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
                <div className="bg-gray-200 rounded-2xl rounded-br-sm px-4 py-3 max-w-lg">
                  <p className="text-sm text-gray-800">{tile.question}</p>
                </div>
              </div>

              {/* AI Response - Formato Blog */}
              <div className="flex gap-4">
                {/* Avatar do Bot - alinhado ao bottom */}
                <div className="flex-shrink-0 self-end mb-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                {/* Bubble da resposta com canto inferior esquerdo arredondado */}
                <div className="bg-blue-50 rounded-2xl rounded-bl-sm px-6 py-4 max-w-2xl">
                  <AIMessage content={tile.answer} />
                  {tile.metrics && <MetricsInfo metrics={tile.metrics} />}
                </div>
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
