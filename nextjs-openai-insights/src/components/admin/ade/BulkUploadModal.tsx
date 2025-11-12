"use client";

import { useState } from "react";
import { X, Upload, FileText } from "lucide-react";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onBulkUpload?: (file: File) => void;
}

export function BulkUploadModal({
  open,
  onClose,
  onBulkUpload,
}: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      setSelectedFile(file);
    } else {
      alert("Please select a CSV file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && onBulkUpload) {
      onBulkUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 px-8 py-6 border-b border-gray-100">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Bulk Upload</p>
            <h2 className="text-2xl font-semibold text-[#1f1f1f]">Import Multiple Prompts</h2>
            <p className="text-sm text-[#6f6f6f]">
              Upload a CSV file with multiple prompts to add them all at once to your dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
            aria-label="Close bulk upload modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col max-h-[60vh]">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Upload CSV File
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : selectedFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-700">
                        Drop your CSV file here, or{" "}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                          browse
                          <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-500">CSV files only, max 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">CSV Format Required</h4>
              <p className="text-sm text-blue-800 mb-3">
                Your CSV should have these columns:
              </p>
              <div className="bg-white rounded p-3 font-mono text-sm text-gray-700">
                title,description,category<br/>
                &quot;CEO Background&quot;,&quot;Research CEO experience and background&quot;,&quot;people&quot;<br/>
                &quot;Revenue Analysis&quot;,&quot;Analyze revenue trends and metrics&quot;,&quot;financial&quot;
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Categories: basic, financial, people, sales, market, strategy
              </p>
            </div>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
                disabled={!selectedFile}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                Upload & Import
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
