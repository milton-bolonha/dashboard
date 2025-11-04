"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  File,
  Image,
  Archive,
  Trash2,
  Download,
  Eye,
} from "lucide-react";

/**
 * Gerenciador de arquivos para uma company específica
 */
export default function FilesManager({
  companyId,
  companyName,
  jobId,
  guestId,
  token,
  entityKey,
}) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("documents");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const categories = [
    { id: "documents", name: "Documents", icon: File },
    { id: "images", name: "Images", icon: Image },
    { id: "archives", name: "Archives", icon: Archive },
  ];

  const hasSessionData =
    !!companyId && !!jobId && !!guestId && typeof token === "string";

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams({
      job_id: jobId,
      guest_id: guestId,
      token,
      company_id: companyId,
      category: selectedCategory,
    });
    if (entityKey) {
      params.set("entity_key", entityKey);
    }
    return params;
  }, [jobId, guestId, token, companyId, entityKey, selectedCategory]);

  const loadFiles = useCallback(async () => {
    if (!hasSessionData) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/guest/files?${buildSearchParams().toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setFiles(data.files || []);
      } else {
        setError(data.error || "Failed to load files");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar arquivos:", error);
      setError("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  }, [hasSessionData, buildSearchParams]);

  useEffect(() => {
    if (hasSessionData) {
      loadFiles();
    } else if (companyId) {
      console.warn("FilesManager: missing session data, cannot load files.");
    }
  }, [hasSessionData, loadFiles, companyId]);

  const withSessionGuard = useCallback(
    (action) => {
      if (!hasSessionData) {
        setError("Missing session information");
        return Promise.resolve();
      }
      return action();
    },
    [hasSessionData]
  );

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) =>
    withSessionGuard(async () => {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setIsUploading(true);
      setError("");

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target.result.split(",")[1];

          const uploadResponse = await fetch("/api/guest/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId,
              guestId,
              token,
              companyId,
              entityKey,
              companyName,
              category: selectedCategory,
              fileData: base64Data,
              fileName: file.name,
            }),
          });

          const uploadData = await uploadResponse.json();

          if (!uploadData.success) {
            throw new Error(uploadData.error || "Failed to upload file");
          }

          if (!uploadData.file?.secure_url) {
            throw new Error("Upload successful but no file URL returned");
          }

          const saveResponse = await fetch("/api/guest/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId,
              guestId,
              token,
              companyId,
              entityKey,
              fileName: file.name,
              fileUrl: uploadData.file.secure_url,
              fileType: file.type,
              fileSize: file.size,
              category: selectedCategory,
              cloudinaryId:
                uploadData.file?.public_id || uploadData.file?.asset_id || null,
            }),
          });

          const saveData = await saveResponse.json();

          if (saveData.success) {
            setFiles((prevFiles) => [...prevFiles, saveData.file]);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } else {
            throw new Error(saveData.error || "Failed to save file metadata.");
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("❌ Erro no processo de upload:", error);
        setError(error.message);
      } finally {
        setIsUploading(false);
      }
    });

  const handleDeleteFile = async (fileId) =>
    withSessionGuard(async () => {
      if (!confirm("Are you sure you want to delete this file?")) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/guest/files/${fileId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            guestId,
            token,
            companyId,
            entityKey,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setFiles((prevFiles) =>
            prevFiles.filter((file) => file.id !== fileId)
          );
        } else {
          setError(data.error || "Failed to delete file");
        }
      } catch (error) {
        console.error("❌ Erro ao deletar arquivo:", error);
        setError("Failed to delete file");
      } finally {
        setIsLoading(false);
      }
    });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (format, type) => {
    if (type === "image") return Image;
    if (type === "archive") return Archive;
    return File;
  };

  if (!companyId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a company to view files
      </div>
    );
  }

  if (!hasSessionData) {
    return (
      <div className="p-6 text-center text-gray-500">
        Missing session information to manage files.
      </div>
    );
  }

  return (
    <div className="files-manager">
      <div className="header mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Files for {companyName}
        </h3>
        <p className="text-sm text-gray-600">
          Upload and manage files for this company
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Click to upload files or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG, PNG, ZIP, RAR (max 10MB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
          disabled={isUploading}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p>No files yet. Upload your first file!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(
              file.fileName.split(".").pop(),
              file.fileType
            );
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.fileSize)} •{" "}
                      {file.fileName.split(".").pop().toUpperCase()} •{" "}
                      {file.fileType}
                    </p>
                    <p className="text-xs text-gray-400">
                      Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(file.fileUrl, "_blank")}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="View file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(file.fileUrl, "_blank")}
                    className="p-2 text-gray-400 hover:text-green-600"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete file"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
