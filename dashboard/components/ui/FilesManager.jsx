"use client";

import { useState, useEffect, useRef } from "react";
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
export default function FilesManager({ companyId, companyName }) {
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

  useEffect(() => {
    if (companyName) {
      loadFiles();
    } else {
      console.warn("FilesManager: companyName is missing, cannot load files.");
    }
  }, [companyName, selectedCategory]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      console.log("📁 Carregando arquivos para:", companyName);
      console.log("📁 Categoria:", selectedCategory);

      const response = await fetch(
        `/api/guest/files?companyName=${companyName}&category=${selectedCategory}`
      );
      const data = await response.json();

      if (data.success) {
        console.log(
          "📁 Arquivos carregados do banco:",
          data.files?.length || 0
        );
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
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    if (!companyName) {
      setError("Cannot upload: Company name is missing.");
      console.error(
        "FilesManager: uploadFile aborted, companyName is missing."
      );
      return;
    }
    // Validar tamanho do arquivo (max 10MB)
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

        // Step 1: Upload to Cloudinary via our new endpoint
        const uploadResponse = await fetch("/api/guest/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            companyName: companyName,
            category: selectedCategory,
          }),
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || "Failed to upload file");
        }

        console.log("✅ Arquivo enviado para Cloudinary:", uploadData.file);

        // Verificar se fileUrl existe antes de salvar
        if (!uploadData.file?.secure_url) {
          throw new Error("Upload successful but no file URL returned");
        }

        // Step 2: Save metadata to our database
        const saveResponse = await fetch("/api/guest/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName,
            fileName: file.name,
            fileUrl: uploadData.file.secure_url,
            fileType: file.type,
            fileSize: file.size,
            category: selectedCategory,
          }),
        });

        const saveData = await saveResponse.json();

        if (saveData.success) {
          console.log(
            "✅ Metadados do arquivo salvos no banco:",
            saveData.file
          );
          setFiles((prevFiles) => [...prevFiles, saveData.file]);
        } else {
          throw new Error(saveData.error || "Failed to save file metadata.");
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("❌ Erro no processo de upload:", error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/guest/files/${fileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setFiles(files.filter((file) => file.id !== fileId));
      } else {
        setError(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("❌ Erro ao deletar arquivo:", error);
      setError("Failed to delete file");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Category Tabs */}
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

      {/* Upload Area */}
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

      {/* Files List */}
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

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-900">Uploading file...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
