"use client";

import { useState, useRef, useCallback } from "react";
import Button from "./Button";

export default function CloudinaryUploadField({
  addon,
  value = "",
  onChange,
  required = false,
  className = "",
  workspaceSlug,
  sectionSlug,
}) {
  const [uploadState, setUploadState] = useState("idle"); // idle, signing, uploading, success, error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Estados: idle, signing, uploading, success, error
  const isUploading = uploadState === "uploading" || uploadState === "signing";

  // Configurações do addon
  const folder = addon.config?.folder || "uploads";
  const maxFileSize = addon.config?.maxFileSize || 10 * 1024 * 1024; // 10MB
  const acceptedTypes = addon.config?.acceptedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  // Gerar URL da imagem a partir do public_id
  const getImageUrl = useCallback((publicId, transformation = {}) => {
    if (!publicId) return null;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return null;

    const {
      width = 300,
      height = 200,
      crop = "fill",
      quality = "auto",
    } = transformation;
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},w_${width},h_${height},q_${quality}/${publicId}`;
  }, []);

  // Validar arquivo
  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(
        `Tipo de arquivo não suportado. Use: ${acceptedTypes.join(", ")}`
      );
    }

    if (file.size > maxFileSize) {
      throw new Error(
        `Arquivo muito grande. Máximo: ${(maxFileSize / 1024 / 1024).toFixed(
          1
        )}MB`
      );
    }
  };

  // Obter assinatura do servidor
  const getSignature = async (folder) => {
    try {
      const payload = {
        folder,
        addonFolder: folder, // Pasta específica do addon
        workspaceSlug,
        sectionSlug,
      };

      const response = await fetch("/api/upload/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao obter assinatura de upload");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Erro na assinatura: ${error.message}`);
    }
  };

  // Upload para Cloudinary
  const uploadToCloudinary = async (file, signatureData) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error("Resposta inválida do servidor"));
          }
        } else {
          reject(new Error(`Upload falhou: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Erro de rede durante upload"));
      });

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
      );
      xhr.send(formData);
    });
  };

  // Processar upload
  const handleUpload = async (file) => {
    try {
      setUploadState("signing");
      setError(null);
      setProgress(0);

      // Validar arquivo
      validateFile(file);

      // Obter assinatura
      const signatureData = await getSignature(folder);

      // Upload
      setUploadState("uploading");
      const result = await uploadToCloudinary(file, signatureData);

      // Sucesso
      setUploadState("success");
      onChange({ target: { name: addon.id, value: result.public_id } });
    } catch (error) {
      setUploadState("error");
      setError(error.message);
      console.error("Upload error:", error);
    }
  };

  // Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    setUploadState("idle");
    setProgress(0);
    setError(null);
    onChange({ target: { name: addon.id, value: "" } });
  };

  const currentImageUrl = getImageUrl(value, { width: 200, height: 120 });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label e Help Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {addon.name} {required && <span className="text-red-500">*</span>}
        </label>
        {addon.helpText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {addon.helpText}
          </p>
        )}
        {/* Pasta organizada automaticamente no Cloudinary */}
      </div>

      {/* Preview da Imagem Atual */}
      {value && currentImageUrl && uploadState !== "uploading" && (
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt={addon.name}
            className="w-32 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Estados de Upload */}
        {uploadState === "idle" && (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 text-gray-400 dark:text-gray-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-blue-600 cursor-pointer hover:text-blue-500">
                  Clique para enviar
                </span>{" "}
                ou arraste uma imagem aqui
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, WEBP até {(maxFileSize / 1024 / 1024).toFixed(1)}MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>
        )}

        {uploadState === "signing" && (
          <div className="space-y-3">
            <div className="w-8 h-8 mx-auto text-blue-500 animate-spin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Preparando upload...
            </p>
          </div>
        )}

        {uploadState === "uploading" && (
          <div className="space-y-3">
            <div className="w-8 h-8 mx-auto text-blue-500 animate-pulse">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enviando... {progress}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {uploadState === "error" && (
          <div className="space-y-3">
            <div className="w-8 h-8 mx-auto text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {error}
              </p>
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={() => {
                  setUploadState("idle");
                  setError(null);
                }}
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
