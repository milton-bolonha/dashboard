"use client";

import { useState } from "react";
import { Palette, Image, Upload, Check } from "lucide-react";

/**
 * Background Customizer para dashboards
 */
export function BackgroundCustomizer({
  currentBackground,
  onBackgroundChange,
}) {
  const [selectedType, setSelectedType] = useState("solid");
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDarkMode, setShowDarkMode] = useState(false);

  // Cores pré-definidas
  const presetColors = [
    "#ffffff",
    "#f8fafc",
    "#f1f5f9",
    "#e2e8f0",
    "#3b82f6",
    "#1d4ed8",
    "#1e40af",
    "#1e3a8a",
    "#10b981",
    "#059669",
    "#047857",
    "#065f46",
    "#f59e0b",
    "#d97706",
    "#b45309",
    "#92400e",
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#991b1b",
  ];

  // Imagens pré-definidas
  const presetImages = [
    {
      id: "gradient-1",
      name: "Blue Gradient",
      url: "/images/backgrounds/gradient-blue.jpg",
    },
    {
      id: "gradient-2",
      name: "Purple Gradient",
      url: "/images/backgrounds/gradient-purple.jpg",
    },
    {
      id: "pattern-1",
      name: "Geometric Pattern",
      url: "/images/backgrounds/pattern-geometric.jpg",
    },
    {
      id: "pattern-2",
      name: "Abstract Pattern",
      url: "/images/backgrounds/pattern-abstract.jpg",
    },
  ];

  const handleColorChange = (color) => {
    setSelectedColor(color);
    onBackgroundChange({
      type: "solid",
      value: color,
    });
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    onBackgroundChange({
      type: "image",
      value: image.url,
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implementar upload para Cloudinary
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/background", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onBackgroundChange({
          type: "image",
          value: data.url,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="background-customizer">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Customize Background
        </h3>
        <p className="text-sm text-gray-600">
          Choose a background for your dashboard
        </p>
      </div>

      {/* Background Type Selector */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setSelectedType("solid")}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === "solid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Solid Color</span>
          </button>
          <button
            onClick={() => setSelectedType("preset")}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === "preset"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Preset Images</span>
          </button>
          <button
            onClick={() => setSelectedType("upload")}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedType === "upload"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
        </div>
      </div>

      {/* Solid Color Options */}
      {selectedType === "solid" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    selectedColor === color
                      ? "border-gray-900 scale-110"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check className="w-4 h-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preset Images */}
      {selectedType === "preset" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Preset Image
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presetImages.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                  selectedImage?.id === image.id
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${image.url})` }}
                />
                {selectedImage?.id === image.id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                  {image.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Image */}
      {selectedType === "upload" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Custom Image
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Upload your own background image
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="background-upload"
            />
            <label
              htmlFor="background-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Choose File"}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, GIF up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* Preview com Dark Mode */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div
          className="w-full h-24 rounded-lg border border-gray-200 overflow-hidden relative"
          style={{
            backgroundColor:
              selectedType === "solid" ? selectedColor : "#f8fafc",
            backgroundImage:
              selectedType === "image"
                ? `url(${selectedImage?.url || selectedColor})`
                : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full h-full bg-black bg-opacity-10 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              Dashboard Preview
            </span>
          </div>
          
          {/* Dark Mode Toggle Preview */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowDarkMode(!showDarkMode)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                showDarkMode 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white text-gray-800'
              }`}
            >
              {showDarkMode ? 'Dark' : 'Light'}
            </button>
          </div>
          
          {/* Preview content with dark mode */}
          <div className={`absolute bottom-2 left-2 right-2 ${
            showDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="text-xs font-medium">Sample Title</div>
            <div className="text-xs opacity-75">Sample content text</div>
          </div>
        </div>
      </div>
    </div>
  );
}
