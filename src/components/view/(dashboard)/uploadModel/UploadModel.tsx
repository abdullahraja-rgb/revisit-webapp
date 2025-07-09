"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileIcon } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { usePatientStore } from "@/stores/patientStore";

export default function UploadModel() {
  const { isUploadModelOpen, toggleUploadModal, selectedPatient, addModel } = usePatientStore();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!isUploadModelOpen) return null;

  const allowedExtensions = [".usdz", ".glb", ".gltf"];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File) => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: `Unsupported format: ${extension}. Use .usdz, .glb, or .gltf` };
    }

    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max 50MB.`,
      };
    }

    return { valid: true };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: { name: string; error: string }[] = [];

    fileArray.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: file.name, error: validation.error! });
      }
    });

    // Show validation results
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      addToast({
        type: "success",
        message: `${validFiles.length} file(s) added successfully`,
        duration: 3000,
      });
    }

    if (invalidFiles.length > 0) {
      const errorMessage =
        invalidFiles.length === 1
          ? `${invalidFiles[0].name}: ${invalidFiles[0].error}`
          : `${invalidFiles.length} files rejected. Check file formats (.usdz, .glb, .gltf) and size (<50MB).`;

      addToast({
        type: "error",
        message: errorMessage,
        duration: 5000,
      });
    }

    if (fileArray.length > validFiles.length + invalidFiles.length) {
      addToast({
        type: "warning",
        message: "Some files were skipped due to validation errors",
        duration: 4000,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast({
        type: "warning",
        message: "Please select at least one file to upload",
        duration: 3000,
      });
      return;
    }

    if (!selectedPatient) {
      addToast({
        type: "error",
        message: "Please select a patient first",
        duration: 3000,
      });
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add models to patient
      selectedFiles.forEach((file, index) => {
        const model = {
          id: `model_${Date.now()}_${index}`,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          modelUrl: URL.createObjectURL(file), // In real app, this would be the uploaded URL
          modelType: file.name.split(".").pop()?.toLowerCase() || "glb",
          room: "Uploaded Room",
          captureDate: new Date().toISOString().split("T")[0],
          thumbnailUrl: "/assets/images/chair-thumb.jpg",
          measurements: [],
        };

        addModel(selectedPatient.id, model);
      });

      addToast({
        type: "success",
        message: `Successfully uploaded ${selectedFiles.length} model(s)`,
        duration: 4000,
      });

      // Reset and close
      setSelectedFiles([]);
      toggleUploadModal();
    } catch (_error) {
      console.error("Upload failed:", _error);
      addToast({
        type: "error",
        message: "Upload failed. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const iconProps = { className: "w-5 h-5 flex-shrink-0" };

    switch (extension) {
      case "usdz":
        return <FileIcon {...iconProps} style={{ color: "#FF6B35" }} />;
      case "glb":
      case "gltf":
        return <FileIcon {...iconProps} style={{ color: "#4CAF50" }} />;
      default:
        return <FileIcon {...iconProps} style={{ color: "#757575" }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload 3D Model</h2>
          <button
            onClick={() => toggleUploadModal()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Info */}
          {selectedPatient && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Uploading for:</strong> {selectedPatient.name}
              </p>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: .usdz, .glb, .gltf files (max 50MB each)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".usdz,.glb,.gltf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Formats:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  <strong>GLB/GLTF:</strong> Recommended for web (excellent compatibility)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>
                  <strong>USDZ:</strong> Limited web support (better for iOS/AR)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={() => toggleUploadModal()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isUploading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isUploading ? "Uploading..." : "Upload Models"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
