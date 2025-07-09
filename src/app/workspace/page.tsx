"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Settings, Maximize2, Minimize2, X } from "lucide-react";
import { usePatientStore } from "@/stores/patientStore";
import { useViewerStore } from "@/stores/viewerStore";
import WorkspaceSidebar from "@/components/view/(dashboard)/workspace/Sidebar";
import PropertiesPanel from "@/components/view/(dashboard)/workspace/PropertiesPanel";
import MeasurementsPanel from "@/components/view/(dashboard)/workspace/MeasurementsPanel";
import EnhancedModelViewer from "@/components/view/(dashboard)/workspace/EnhancedModelViewer";
import { fullscreenAPI } from "@/utils/fullscreen";

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL parameters
  const patientId = searchParams.get("patient");
  const modelId = searchParams.get("model");

  // Store hooks
  const {
    patients,
    isLoading: patientsLoading,
    loadPatients,
    getPatientById,
    getModelById,
    setSelectedPatient,
  } = usePatientStore();
  const { isFullscreen, setFullscreen, toggleFullscreen, isFullscreenSupported } = useViewerStore();

  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [activeTab, setActiveTab] = useState<"properties" | "measurements">("properties");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load patients if not already loaded
  useEffect(() => {
    if (patients.length === 0 && !patientsLoading) {
      loadPatients();
    }
  }, [patients.length, patientsLoading, loadPatients]);

  // Load patient and model data from URL params
  const patient = patientId ? getPatientById(patientId) : null;
  const model = patient && modelId && patientId ? getModelById(patientId, modelId) : null;

  // Validate URL parameters and load data
  useEffect(() => {
    // Don't validate if patients are still loading
    if (patientsLoading) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!patientId || !modelId) {
      setError("Missing patient or model ID in URL");
      setTimeout(() => router.push("/"), 1000);
      return;
    }

    if (patients.length === 0) {
      setError("No patient data available");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    if (!patient) {
      setError(`Patient with ID "${patientId}" not found`);
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    if (!model) {
      setError(`Model with ID "${modelId}" not found for patient "${patient.name}"`);
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    // Set selected patient in store for UI consistency
    setSelectedPatient(patient);
    setIsLoading(false);
  }, [
    patientId,
    modelId,
    patient,
    model,
    router,
    setSelectedPatient,
    patients.length,
    patientsLoading,
  ]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setShowSidebar(false);
        setShowProperties(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const cleanup = fullscreenAPI.onFullscreenChange(() => {
      setFullscreen(fullscreenAPI.isFullscreen());
    });
    return cleanup;
  }, [setFullscreen]);

  // Note: Removed auto-switching to measurements tab to allow free navigation between tabs

  // Show loading or error state
  if (patientsLoading || isLoading || error || !patient || !model) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {error ? "Error" : "Loading Workspace"}
          </h2>
          <p className="text-gray-500">
            {error ||
              (patientsLoading ? "Loading patient data..." : "Loading 3D model workspace...")}
          </p>
          {error && <p className="text-sm text-gray-400 mt-2">Redirecting to dashboard...</p>}
        </div>
      </div>
    );
  }

  const handleToggleFullscreen = async () => {
    try {
      await toggleFullscreen();
    } catch (error) {
      console.warn("Fullscreen toggle failed:", error);
      setFullscreen(!isFullscreen);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Header with model info and controls */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {model.name}
            </h1>
            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>Patient: {patient.name}</span>
              <span>Room: {model.room}</span>
              <span>Captured: {model.captureDate}</span>
              <span>Type: {model.modelType.toUpperCase()}</span>
            </div>
            <div className="sm:hidden text-xs text-gray-500 mt-1">
              {patient.name} • {model.modelType.toUpperCase()}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg transition-colors ${
                showSidebar ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
              }`}
              title="Toggle Tools"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Properties Toggle */}
            <button
              onClick={() => setShowProperties(!showProperties)}
              className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                showProperties ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
              }`}
              title="Toggle Properties"
            >
              {showProperties ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            {isFullscreenSupported() && (
              <button
                onClick={handleToggleFullscreen}
                className={`hidden sm:flex p-2 rounded-lg transition-colors ${
                  isFullscreen ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Back Button */}
            <button
              onClick={handleBackToDashboard}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {isMobile && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowSidebar(false)}
              />
            )}
            <div
              className={`${
                isMobile ? "fixed left-0 top-0 h-full z-50" : "relative"
              } flex-shrink-0`}
            >
              <WorkspaceSidebar
                onClose={() => setShowSidebar(false)}
                onMeasurementToolActivated={() => {
                  setActiveTab("measurements");
                  setShowProperties(true); // Ensure the panel is visible
                }}
              />
            </div>
          </>
        )}

        {/* 3D Model Viewer */}
        <div className="flex-1 relative overflow-hidden">
          <EnhancedModelViewer
            modelPath={model.modelUrl}
            showMeasurements={activeTab === "measurements"}
          />

          {/* Fullscreen Status */}
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-50 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <Minimize2 className="w-4 h-4" />
                <span>Fullscreen Mode</span>
              </div>
              <div className="text-xs text-purple-200 mt-1">Press ESC to exit</div>
            </div>
          )}
        </div>

        {/* Right Panel with Tabs */}
        {showProperties && !isMobile && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 flex flex-col">
            {/* Tab Header */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("properties")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "properties"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab("measurements")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "measurements"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Measurements
              </button>
              <button
                onClick={() => setShowProperties(false)}
                className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "properties" ? <PropertiesPanel /> : <MeasurementsPanel />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
