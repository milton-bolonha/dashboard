"use client";

import { useState } from "react";
import { X, Plus, Zap } from "lucide-react";

type RequestSize = "small" | "medium" | "large";

interface AddPromptModalProps {
  open: boolean;
  onClose: () => void;
  onAddPrompt?: (prompt: {
    title: string;
    description: string;
    useMaxPrompt: boolean;
    requestSize: RequestSize;
  }) => void;
}

export function AddPromptModal({
  open,
  onClose,
  onAddPrompt,
}: AddPromptModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useMaxPrompt, setUseMaxPrompt] = useState(false);
  const [requestSize, setRequestSize] = useState<RequestSize>("small");

  const handleSubmit = () => {
    if (!title.trim()) return;

    onAddPrompt?.({
      title: title.trim(),
      description: description.trim() || title.trim(),
      useMaxPrompt,
      requestSize,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setUseMaxPrompt(false);
    setRequestSize("small");

    onClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setUseMaxPrompt(false);
    setRequestSize("small");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-8 py-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">
              Add New Prompt
            </p>
            <h2 className="text-2xl font-semibold text-[#1f1f1f]">
              Create Custom Research Prompt
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5] cursor-pointer"
            aria-label="Close add prompt modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col">
          <div className="flex-1 px-8 pb-6 space-b-6 overflow-y-auto max-h-[60vh]">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Prompt Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., CEO Background & Experience"
                className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                What should the AI research?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what information you want the AI to find. Be specific about the type of data and context needed."
                rows={4}
                className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0 resize-none"
              />
            </div>

            {/* Request Size */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Request Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestSize("small")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    requestSize === "small"
                      ? "border-black bg-black text-white"
                      : "border-[#e4e4e4] bg-white text-[#1f1f1f] hover:border-black/30"
                  }`}
                >
                  Small
                </button>
                <button
                  type="button"
                  onClick={() => setRequestSize("medium")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    requestSize === "medium"
                      ? "border-black bg-black text-white"
                      : "border-[#e4e4e4] bg-white text-[#1f1f1f] hover:border-black/30"
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setRequestSize("large")}
                  disabled={!useMaxPrompt}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    requestSize === "large"
                      ? "border-black bg-black text-white"
                      : "border-[#e4e4e4] bg-white text-[#1f1f1f] hover:border-black/30"
                  } ${!useMaxPrompt ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={
                    !useMaxPrompt
                      ? "Large size only available with Max Mode"
                      : ""
                  }
                >
                  Large
                </button>
              </div>
              <p className="text-xs text-[#6f6f6f]">
                {requestSize === "small" && "Short responses (~200-400 tokens)"}
                {requestSize === "medium" &&
                  "Medium responses (~600-800 tokens)"}
                {requestSize === "large" &&
                  "Long responses (~1200-1600 tokens, requires Max Mode)"}
              </p>
            </div>

            {/* MAX PROMPT Checkbox */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMaxPrompt}
                  onChange={(e) => {
                    setUseMaxPrompt(e.target.checked);
                    if (!e.target.checked && requestSize === "large") {
                      setRequestSize("medium");
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-[#1f1f1f]">
                    Use MAX MODE
                  </span>
                </div>
              </label>
              <p className="text-xs text-[#6f6f6f] ml-7">
                Enable advanced AI with greater capabilities using GPT-5 instead
                of GPT-5-nano. Large request size requires Max Mode.
              </p>
            </div>
          </div>

          <footer className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Prompts will be added to your current dashboard
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add Prompt
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
