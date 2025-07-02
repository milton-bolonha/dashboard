"use client";

import { useState, useRef, useCallback } from "react";
import Button from "./Button";

export default function CloudinaryGalleryField({
  addon,
  value = [],
  onChange,
  required = false,
  className = "",
  workspaceSlug,
  sectionSlug,
}) {
  const [uploadState, setUploadState] = useState("idle");
  const [currentUpload, setCurrentUpload] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Garantir que value seja array
  const currentImages = Array.isArray(value) ? value : [];

  // Configurações
  const folder = addon.config?.folder || "gallery";
  const maxFileSize = addon.config?.maxFileSize || 10 * 1024 * 1024;
  const maxImages = addon.config?.maxImages || 10;
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

  // URL da imagem
  const getImageUrl = useCallback((publicId) => {
    if (!publicId) return null;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return null;
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_200,h_150,q_auto/${publicId}`;
  }, []);

  // Validar arquivo
  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      throw new Error(`Tipo não suportado: ${file.type}`);
    }
    if (file.size > maxFileSize) {
      throw new Error(
        `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      );
    }
  };

  // Obter assinatura
  const getSignature = async (folder) => {
    try {
      const response = await fetch("/api/upload/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          addonFolder: folder,
          workspaceSlug,
          sectionSlug,
        }),
      });

      if (!response.ok) throw new Error("Falha ao obter assinatura");
      return await response.json();
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
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new Error("Resposta inválida"));
          }
        } else {
          reject(new Error(`Upload falhou: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Erro de rede"));
      });

      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`
      );
      xhr.send(formData);
    });
  };

  // Upload processo
  const processUploadQueue = async (files) => {
    if (currentImages.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imagens permitidas`);
      return;
    }

    setUploadState("uploading");
    setError(null);
    const newImages = [...currentImages];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentUpload({
          name: file.name,
          index: i + 1,
          total: files.length,
        });
        setProgress(0);

        // Validar
        validateFile(file);

        // Obter assinatura
        const signatureData = await getSignature(folder);

        // Upload
        const result = await uploadToCloudinary(file, signatureData);

        // Adicionar à lista
        newImages.push(result.public_id);

        // Atualizar estado
        onChange({ target: { name: addon.id, value: newImages } });
      }

      setUploadState("idle");
      setCurrentUpload(null);
    } catch (error) {
      setUploadState("error");
      setError(error.message);
      setCurrentUpload(null);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const newImages = currentImages.filter(
      (_, index) => index !== indexToRemove
    );
    onChange({ target: { name: addon.id, value: newImages } });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) processUploadQueue(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const isUploading = uploadState === "uploading";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label e Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {addon.name} {required && <span className="text-red-500">*</span>}
          <span className="ml-2 text-xs text-gray-500">
            ({currentImages.length}/{maxImages} imagens)
          </span>
        </label>
        {addon.helpText && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {addon.helpText}
          </p>
        )}
        {/* Pasta organizada automaticamente no Cloudinary */}
      </div>

      {/* Grid de Imagens */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {currentImages.map((publicId, index) => {
            const imageUrl = getImageUrl(publicId);
            return (
              <div key={`${publicId}-${index}`} className="relative group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-200 rounded border flex items-center justify-center">
                    <span className="text-xs text-gray-500">
                      Img {index + 1}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Area */}
      {currentImages.length < maxImages && (
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
          {uploadState === "idle" && (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 text-gray-400">
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
                    Clique para adicionar imagens
                  </span>{" "}
                  ou arraste múltiplas imagens aqui
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, WEBP até {(maxFileSize / 1024 / 1024).toFixed(1)}MB
                  cada
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar Imagens
              </Button>
            </div>
          )}

          {uploadState === "uploading" && currentUpload && (
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
                  Enviando {currentUpload.name}... ({currentUpload.index}/
                  {currentUpload.total})
                </p>
                <p className="text-xs text-gray-500">{progress}%</p>
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

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) processUploadQueue(files);
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Limite atingido */}
      {currentImages.length >= maxImages && (
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ✅ Limite máximo de {maxImages} imagens atingido
          </p>
        </div>
      )}
    </div>
  );
}
