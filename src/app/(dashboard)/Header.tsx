"use client";

import { User, Bell, Settings } from "lucide-react";
import { Patient } from "../../../types/global";
import OptimizedImage from "@/components/ui/image/OptimizedImage";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";

interface HeaderProps {
  selectedPatient: Patient | null;
  onUploadModel?: () => void;
  onGenerateReport?: () => void;
}

export function Header({ selectedPatient, onUploadModel, onGenerateReport }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="mt-2 w-28 h-6 relative overflow-hidden">
          <OptimizedImage
            src="/assets/images/logo/logo.png"
            alt="logo"
            fill
            className="object-contain"
          />
        </div>

        {selectedPatient && (
          <div className="ml-8 flex items-center space-x-2 text-sm text-gray-600">
            <span>Patient:</span>
            <span className="font-medium text-gray-900">{selectedPatient.name}</span>
            <span className="text-gray-400">|</span>
            <span>{selectedPatient.condition}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {selectedPatient && onUploadModel && (
            <PrimaryButton title="Upload Model" onClick={onUploadModel} className="w-32 h-8" />
          )}

          {selectedPatient && onGenerateReport && (
            <PrimaryButton
              title="Generate Report"
              onClick={onGenerateReport}
              className="w-32 h-8 bg-teal-600"
            />
          )}
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </header>
  );
}
