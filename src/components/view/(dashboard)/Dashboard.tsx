"use client";

import { useEffect } from "react";
import { usePatientStore } from "@/stores/patientStore";
import { Sidebar } from "../../../app/(dashboard)/Sidebar";
import { Header } from "@/app/(dashboard)/Header";
import UploadModel from "./uploadModel/UploadModel";

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const {
    patients,
    selectedPatient,
    isLoading,
    error,
    isUploadModelOpen,
    sidebarCollapsed,
    loadPatients,
    setSelectedPatient,
    toggleUploadModal,
    toggleReportGenerator,
    toggleSidebar,
  } = usePatientStore();

  // Load patients data on mount
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-select first patient if none selected
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, selectedPatient, setSelectedPatient]);

  const handleGenerateReport = () => {
    if (selectedPatient) {
      toggleReportGenerator();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onUploadModel={toggleUploadModal}
        onGenerateReport={handleGenerateReport}
      />

      <div className="flex-1 flex flex-col">
        <Header
          selectedPatient={selectedPatient}
          onUploadModel={toggleUploadModal}
          onGenerateReport={handleGenerateReport}
        />

        {/* Loading Banner */}
        {isLoading && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-sm text-blue-700">Loading patient data...</p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">⚠️</div>
                <p className="text-sm text-red-700">Error loading patient data: {error}</p>
              </div>
              <button
                onClick={loadPatients}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Modals */}
      {isUploadModelOpen && selectedPatient && <UploadModel />}

      {/* TODO: ReportGenerator needs to be updated for new architecture */}
      {/* {isReportGeneratorOpen && selectedPatient && (
        <ReportGenerator
          isOpen={isReportGeneratorOpen}
          onClose={toggleReportGenerator}
          patient={selectedPatient}
          measurements={[]}
        />
      )} */}
    </div>
  );
}
