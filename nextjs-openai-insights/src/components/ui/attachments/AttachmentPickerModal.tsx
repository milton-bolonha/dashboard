"use client";

import { useEffect, useState } from "react";
import { Paperclip, X } from "lucide-react";

import type { TileChatAttachment } from "@/lib/types";

type CloudinaryUploadResult = {
  event?: string;
  info?: {
    asset_id?: string;
    secure_url?: string;
    url?: string;
    original_filename?: string;
    format?: string;
  };
};

type CloudinaryWidget = {
  open: () => void;
};

interface AttachmentPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (attachments: TileChatAttachment[]) => void;
  inputKey: number;
}

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"];
const MAX_TEXT_PREVIEW = 10_000;

async function readFileText(file: File): Promise<string | null> {
  const shouldReadAsText =
    TEXT_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix)) ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".txt");

  if (!shouldReadAsText) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.slice(0, MAX_TEXT_PREVIEW));
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

function humanFileSize(size: number): string {
  if (!Number.isFinite(size)) return "";
  if (size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const num = size / Math.pow(1024, exponent);
  return `${num.toFixed(num >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function AttachmentPickerModal({
  open,
  onClose,
  onSelect,
  inputKey,
}: AttachmentPickerModalProps) {
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

  const handleLocalSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const now = Date.now();

    const attachments = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const textContent = await readFileText(file);
        const fallbackSnippet = textContent
          ? textContent
          : `[Binary attachment "${file.name}" (${file.type || "unknown"}). Configure Cloudinary to share a download URL.]`;

        const attachment: TileChatAttachment = {
          id: `local_${now}_${index}`,
          name: file.name,
          mimeType: file.type || undefined,
          size: file.size,
          textContent: textContent ?? fallbackSnippet,
        };
        return attachment;
      }),
    );
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
            className="rounded-full border border-[#EFEFEF] p-2 text-[#6f6f6f] transition hover:border-[#DCDCDC] hover:text-black cursor-pointer"
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
              <span className="text-[11px] text-[#9B9B9B]">
                Text previews limited to {humanFileSize(MAX_TEXT_PREVIEW)} per file.
              </span>
            </label>
          </div>
        </div>
      </aside>
    </div>
  );
}


