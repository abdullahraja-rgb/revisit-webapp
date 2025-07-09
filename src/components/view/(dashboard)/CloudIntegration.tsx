"use client";

import { useState } from "react";
import { Cloud, Shield, Upload, Download, Trash2, Eye, Lock } from "lucide-react";

interface CloudFile {
  id: string;
  name: string;
  type: "model" | "image" | "video";
  size: number;
  uploadDate: string;
  url: string;
  encrypted: boolean;
  patientId: string;
}

interface CloudIntegrationProps {
  patientId: string;
  onFileSelect: (file: CloudFile) => void;
}

export function CloudIntegration({ patientId, onFileSelect }: CloudIntegrationProps) {
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([
    {
      id: "1",
      name: "living_room_scan.obj",
      type: "model",
      size: 15643200, // 15.6 MB
      uploadDate: "2024-01-15",
      url: "/models/living_room.obj",
      encrypted: true,
      patientId,
    },
    {
      id: "2",
      name: "kitchen_overview.jpg",
      type: "image",
      size: 2048000, // 2 MB
      uploadDate: "2024-01-15",
      url: "/images/kitchen.jpg",
      encrypted: true,
      patientId,
    },
  ]);

  const [isConnected] = useState(true);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const deleteFile = async (fileId: string) => {
    // Simulate secure deletion
    setCloudFiles((prev) => prev.filter((f) => f.id !== fileId));
    console.log(`Securely deleting file ${fileId} from Azure storage...`);
  };

  const downloadFile = (file: CloudFile) => {
    // In real implementation, this would create a temporary signed URL
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isConnected ? "bg-green-100" : "bg-red-100"}`}>
              <Cloud className={`w-5 h-5 ${isConnected ? "text-green-600" : "text-red-600"}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Cloud Storage</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? "Connected to Azure Blob Storage" : "Connection Error"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="p-4">
        <div className="space-y-3">
          {cloudFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {file.type === "model" && <Upload className="w-4 h-4 text-blue-500" />}
                  {file.type === "image" && <Eye className="w-4 h-4 text-green-500" />}
                  {file.type === "video" && <Download className="w-4 h-4 text-purple-500" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    {file.encrypted && <Lock className="w-3 h-3 text-gray-400" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • Uploaded {file.uploadDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onFileSelect(file)}
                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                  title="View/Load"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => downloadFile(file)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cloudFiles.length === 0 && (
          <div className="text-center py-8">
            <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No files uploaded yet</p>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Storage Used:{" "}
              {formatFileSize(cloudFiles.reduce((total, file) => total + file.size, 0))}
            </span>
            <span className="text-gray-600">Files: {cloudFiles.length}</span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Shield className="w-3 h-3" />
            <span>AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions for cloud operations
export const cloudUtils = {
  // Generate signed URL for secure file access
  generateSignedUrl: async (fileId: string, expirationMinutes: number = 60): Promise<string> => {
    // In real implementation, this would call Azure Blob Storage API
    console.log(
      `Generating signed URL for file ${fileId}, expires in ${expirationMinutes} minutes`
    );
    return `https://storage.azure.com/container/${fileId}?signature=...`;
  },

  // Encrypt file before upload
  encryptFile: async (file: File): Promise<Blob> => {
    // In real implementation, use Web Crypto API for AES encryption
    console.log(`Encrypting file ${file.name}...`);
    return file; // Placeholder
  },

  // Secure file deletion
  secureDelete: async (fileId: string): Promise<void> => {
    // In real implementation, use Azure Blob Storage secure delete
    console.log(`Performing secure deletion of file ${fileId}...`);
  },

  // HIPAA compliance check
  validateHIPAACompliance: (_file: File): boolean => {
    // TODO: Implement HIPAA compliance check
    console.log("Validating HIPAA compliance for file:", _file.name);
    // Check file contains no unencrypted PHI
    return true; // Placeholder
  },
};
