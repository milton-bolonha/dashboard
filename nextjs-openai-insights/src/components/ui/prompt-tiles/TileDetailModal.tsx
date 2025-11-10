"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Copy,
  Info,
  Loader2,
  Paperclip,
  SendHorizontal,
  User,
  X,
} from "lucide-react";

import type { Tile, TileChatAttachment, TileMessage } from "@/lib/types";
import type { AdminTheme } from "@/lib/state/admin-theme-context";

interface TileDetailModalProps {
  tile: Tile;
  onClose: () => void;
  onSubmit: (payload: {
    message: string;
    attachments?: TileChatAttachment[];
  }) => Promise<void>;
  isSubmitting: boolean;
  theme: AdminTheme;
}

export function TileDetailModal({
  tile,
  onClose,
  onSubmit,
  isSubmitting,
  theme,
}: TileDetailModalProps) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<TileChatAttachment[]>([]);
  const [isAttachmentPickerOpen, setAttachmentPickerOpen] = useState(false);
  const [attachmentInputKey, setAttachmentInputKey] = useState(() => Date.now());

  const isAde = theme === "ade";

  useEffect(() => {
    if (!copiedKey) return;
    const timeout = window.setTimeout(() => setCopiedKey(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [copiedKey]);

  const history = useMemo<TileMessage[]>(() => {
    if (Array.isArray(tile.history) && tile.history.length > 0) {
      return tile.history.map((entry) => ({
        ...entry,
        role:
          entry.role === "assistant" || entry.role === "system" || entry.role === "user"
            ? entry.role
            : "assistant",
      }));
    }
    return [
      {
        id: `${tile.id}_prompt`,
        role: "user" as const,
        content: tile.prompt,
        createdAt: tile.createdAt,
      },
      {
        id: `${tile.id}_assistant`,
        role: "assistant" as const,
        content: tile.content,
        createdAt: tile.updatedAt,
      },
    ].filter((entry) => entry.content && entry.content.trim().length > 0);
  }, [tile.content, tile.createdAt, tile.history, tile.id, tile.prompt, tile.updatedAt]);

  const formatTimestamp = (value: string | undefined) => {
    if (!value) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const formatDate = (value: string | undefined) => {
    if (!value) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const infoSummary = useMemo(() => {
    const lines = [
      `Model: ${tile.model ?? "—"}`,
      tile.totalTokens ? `Tokens: ${tile.totalTokens}` : null,
      tile.createdAt ? `Created: ${formatDate(tile.createdAt)}` : null,
      tile.updatedAt ? `Updated: ${formatDate(tile.updatedAt)}` : null,
    ].filter(Boolean) as string[];
    return lines.join("\n");
  }, [tile.model, tile.totalTokens, tile.createdAt, tile.updatedAt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSubmit({ message: trimmed, attachments });
    setMessage("");
    setAttachments([]);
  };

  const handleRequestClose = () => {
    setIsVisible(false);
    setAttachments([]);
    setMessage("");
    setAttachmentPickerOpen(false);
    window.setTimeout(onClose, 180);
  };

  const handleCopyContent = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(id);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleAttachmentSelect = (items: TileChatAttachment[]) => {
    if (!items.length) {
      setAttachmentPickerOpen(false);
      return;
    }
    setAttachments((prev) => [...prev, ...items]);
    setAttachmentPickerOpen(false);
    setAttachmentInputKey(Date.now());
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const renderHistoryEntry = (entry: TileMessage) => {
    const timestamp = formatTimestamp(entry.createdAt ?? tile.updatedAt);
    const copyLabel = copiedKey === entry.id ? "Copied" : "Copy";

    if (entry.role === "assistant") {
      return (
        <div key={entry.id} className="flex items-start gap-3">
          <div
            className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
              isAde ? "bg-[#F2F2F2] text-[#242424]" : "bg-[#FFE7D6] text-[#E76F25]"
            }`}
          >
            <Bot className="h-4 w-4" />
          </div>
          <div
            className={`max-w-xl rounded-2xl border px-4 py-3 shadow-sm ${
              isAde ? "border-[#EEEEEE] bg-[#F9F9F9]" : "border-orange-200 bg-white"
            }`}
          >
            <p className="text-sm leading-relaxed text-[#2f2f2f] whitespace-pre-wrap">
              {entry.content}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span
                className={`font-semibold uppercase tracking-[0.3em] ${
                  isAde ? "text-[#9f9f9f]" : "text-[#b97a42]"
                }`}
              >
                {timestamp}
              </span>
              <button
                type="button"
                onClick={() => handleCopyContent(entry.content, entry.id)}
                className={`inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 transition ${
                  isAde
                    ? "text-[#7D7D7D] hover:border-black/10 hover:text-black"
                    : "text-[#b97a42] hover:border-[#E7B488] hover:text-[#7f4d15]"
                }`}
                aria-label="Copy assistant reply"
              >
                <Copy className="h-3.5 w-3.5" />
                {copyLabel}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (entry.role === "system") {
      return (
        <div key={entry.id} className="flex justify-center">
          <div
            className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] ${
              isAde ? "bg-[#F5F5F5] text-[#616161]" : "bg-[#FFF1E7] text-[#c96418]"
            }`}
          >
            {entry.content}
          </div>
        </div>
      );
    }

    return (
      <div key={entry.id} className="flex justify-end">
        <div
          className={`max-w-xl rounded-2xl border px-4 py-3 shadow-sm ${
            isAde ? "border-[#EFEFEF] bg-white" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-sm leading-relaxed text-[#1f1f1f] whitespace-pre-wrap">
            {entry.content}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span
              className={`flex items-center gap-1 font-semibold uppercase tracking-[0.3em] ${
                isAde ? "text-[#9f9f9f]" : "text-[#a1a1a1]"
              }`}
            >
              <User className="h-3 w-3" />
              {timestamp}
            </span>
            <button
              type="button"
              onClick={() => handleCopyContent(entry.content, entry.id)}
              className={`inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 transition ${
                isAde
                  ? "text-[#7D7D7D] hover:border-black/10 hover:text-black"
                  : "text-[#b97a42] hover:border-[#E7B488] hover:text-[#7f4d15]"
              }`}
              aria-label="Copy message"
            >
              <Copy className="h-3.5 w-3.5" />
              {copyLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
        onClick={handleRequestClose}
      >
        <aside
          className={`relative flex h-full w-full max-w-[780px] flex-col overflow-hidden transition-transform duration-200 ${
            isAde
              ? "rounded-bl-[32px] rounded-tl-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
              : "border-l border-orange-200 bg-white shadow-[0_20px_60px_rgba(17,24,39,0.2)]"
          } ${isVisible ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <header
            className={
              isAde
                ? "flex flex-shrink-0 items-start justify-between gap-4 px-8 py-6"
                : "flex flex-shrink-0 items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-[#FFE8DA] via-[#FFF4EC] to-[#FFE0CC] px-6 py-5"
            }
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold leading-tight text-gray-900">
                {tile.title}
              </h2>
              <p className="text-sm text-gray-500">
                {tile.templateTileId ?? "Custom insight"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title={infoSummary}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                aria-label="Insight details"
              >
                <Info className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRequestClose}
                className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                  isAde
                    ? "border-gray-200 text-gray-700 transition hover:bg-gray-100"
                    : "border-[#F4C7A6] bg-white text-[#E46B1F] hover:bg-[#FFE8D5]"
                }`}
                aria-label="Close detail modal"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div
              className={`flex-1 overflow-y-auto px-6 py-6 ${
                isAde ? "bg-white" : "bg-[#FFF8F3]"
              }`}
            >
              <div className="space-y-5">
                {history.length === 0 ? (
                  <div
                    className={`rounded-2xl border border-dashed px-4 py-6 text-center text-sm ${
                      isAde
                        ? "border-[#E8E8E8] bg-[#FAFAFA] text-[#7a7a7a]"
                        : "border-orange-200 bg-white/70 text-[#a86a3a]"
                    }`}
                  >
                    No conversation captured for this tile yet. Generate follow-up prompts to
                    build a thread.
                  </div>
                ) : (
                  history.map(renderHistoryEntry)
                )}
              </div>

              {!isAde ? (
                <section className="mt-8 rounded-2xl border border-orange-200 bg-white/95 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[#EA6C1F]">
                        Prompt sent to OpenAI
                      </h3>
                      <p className="text-[12px] text-[#80634e]">
                        This is the exact instruction used to generate the latest response.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyContent(tile.prompt, "prompt")}
                      className="inline-flex items-center gap-2 rounded-full border border-[#F3C8A9] px-3 py-1 text-xs font-semibold text-[#C55E16] transition hover:bg-[#FFF2E5]"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedKey === "prompt" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#FFF3E4] px-4 py-3 text-[13px] leading-relaxed text-[#5a3112]">
                    {tile.prompt && tile.prompt.trim().length > 0
                      ? tile.prompt
                      : "Prompt details are not available for this session."}
                  </pre>
                </section>
              ) : null}
            </div>

            <footer
              className={`px-6 py-4 ${isAde ? "bg-white" : "border-orange-100 bg-white"}`}
            >
              <form onSubmit={handleSubmit} className="space-y-3">
                {attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <span
                        key={attachment.id}
                        className="inline-flex items-center gap-2 rounded-full bg-[#F2F2F2] px-3 py-1 text-xs font-semibold text-[#414141]"
                      >
                        {attachment.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="rounded-full border border-transparent p-1 transition hover:border-white hover:bg-white"
                          aria-label="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="relative rounded-2xl border border-[#E7E7E7] bg-[#F5F5F5] p-3 shadow-inner transition focus-within:border-[#D9D9D9] focus-within:bg-white">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask the AI to go deeper, request missing data, or suggest next steps…"
                    className="h-28 w-full resize-none border-none bg-transparent pr-24 text-sm text-[#2d2d2d] outline-none focus:bg-white focus:ring-0"
                    disabled={isSubmitting}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAttachmentPickerOpen(true)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E3E3] text-[#3c3c3c] transition hover:border-black/20 hover:text-black"
                      aria-label="Attach files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || message.trim().length === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                      aria-label="Send follow-up"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </footer>
          </div>
        </aside>
      </div>

      <AttachmentPickerModal
        open={isAttachmentPickerOpen}
        onClose={() => setAttachmentPickerOpen(false)}
        onSelect={handleAttachmentSelect}
        inputKey={attachmentInputKey}
      />

      {copiedKey ? (
        <div className="pointer-events-none fixed bottom-10 right-8 z-[70] rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Copied!
        </div>
      ) : null}
    </>
  );
}

type CloudinaryWidget = {
  open: () => void;
  close: () => void;
};

type CloudinaryUploadInfo = {
  asset_id?: string;
  secure_url?: string;
  url?: string;
  original_filename?: string;
  format?: string;
};

type CloudinaryUploadResult = {
  event: string;
  info?: CloudinaryUploadInfo;
};

function AttachmentPickerModal({
  open,
  onClose,
  onSelect,
  inputKey,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (attachments: TileChatAttachment[]) => void;
  inputKey: number;
}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);
  const [widgetReady, setWidgetReady] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const cloudinary = (window as Window & {
      cloudinary?: { createUploadWidget?: unknown };
    }).cloudinary;
    return Boolean(
      (cloudinary as { createUploadWidget?: unknown } | undefined)?.createUploadWidget,
    );
  });

  useEffect(() => {
    if (!open || !isCloudinaryConfigured || widgetReady) return;
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setWidgetReady(true);
    script.onerror = () => setWidgetReady(false);
    document.body.appendChild(script);
    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [open, isCloudinaryConfigured, widgetReady]);

  const handleLocalSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const now = Date.now();
    const attachments = Array.from(files).map((file, index) => ({
      id: `local_${now}_${index}`,
      name: file.name,
    }));
    onSelect(attachments);
  };

  const handleOpenCloudinary = () => {
    if (!isCloudinaryConfigured || typeof window === "undefined") return;
    const cloudinary = (window as Window & {
      cloudinary?: {
        createUploadWidget?: (
          options: Record<string, unknown>,
          callback: (error: unknown, result: CloudinaryUploadResult) => void,
        ) => CloudinaryWidget;
      };
    }).cloudinary;
    if (!cloudinary?.createUploadWidget) return;

    const widget = cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: true,
        maxFiles: 5,
      },
      (_error, result) => {
        if (!result || result.event !== "success" || !result.info) return;
        const info = result.info;
        const url = info.secure_url ?? info.url;
        const attachment: TileChatAttachment = {
          id: `cloudinary_${info.asset_id ?? Date.now().toString(36)}`,
          name: info.original_filename
            ? `${info.original_filename}${info.format ? `.${info.format}` : ""}`
            : "Cloudinary asset",
          url: url ?? undefined,
        };
        onSelect([attachment]);
      },
    );

    widget.open();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-start bg-slate-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-r border-[#EFEFEF] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[#F1F1F1] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#1f1f1f]">Attach files</h2>
            <p className="text-xs text-[#6f6f6f]">
              Upload decks, screenshots or research artifacts to keep this thread in sync.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#EFEFEF] p-2 text-[#6f6f6f] transition hover:border-[#DCDCDC] hover:text-black"
            aria-label="Close attachment picker"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          {isCloudinaryConfigured ? (
            <button
              type="button"
              onClick={handleOpenCloudinary}
              disabled={!widgetReady}
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#E0DEFF] bg-[#F7F6FF] px-4 py-4 text-sm font-semibold text-[#5246E9] shadow-sm transition hover:border-[#C7C1FF] hover:bg-[#EEECFF] disabled:cursor-not-allowed disabled:text-[#B4AEFF]"
            >
              <Paperclip className="h-4 w-4" />
              {widgetReady ? "Browse Cloudinary library" : "Preparing Cloudinary widget…"}
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E0DEFF] bg-[#FBFAFF] px-4 py-4 text-sm text-[#6B63C7]">
              Configure <code className="text-xs font-semibold">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>{" "}
              and <code className="text-xs font-semibold">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> to
              enable Cloudinary uploads.
            </div>
          )}
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B9B9B]">
              or upload locally
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[#D0D0D0] px-6 py-10 text-sm text-[#7d7d7d] transition hover:border-black/20 hover:bg-[#fafafa]">
              <Paperclip className="h-6 w-6 text-[#4b4b4b]" />
              <span>Select files from your computer</span>
              <input
                key={inputKey}
                type="file"
                multiple
                onChange={(event) => handleLocalSelect(event.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </aside>
    </div>
  );
}

