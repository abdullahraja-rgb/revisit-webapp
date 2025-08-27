"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { Eye, EyeOff, Settings, Maximize2, Minimize2, X, AlertTriangle, ChevronLeft } from "lucide-react";
import { useViewerStore } from "@/stores/viewerStore";
import WorkspaceSidebar from "@/components/view/(dashboard)/workspace/Sidebar";
import PropertiesPanel from "@/components/view/(dashboard)/workspace/PropertiesPanel";
import MeasurementsPanel from "@/components/view/(dashboard)/workspace/MeasurementsPanel";
import EnhancedModelViewer from "@/components/view/(dashboard)/workspace/EnhancedModelViewer";
import CalibrationModal from "@/components/view/(dashboard)/workspace/CalibrationModal";
import { fullscreenAPI } from "@/utils/fullscreen";
import { clsx } from 'clsx';

// This is the main content component that contains all the logic.
// It's wrapped in Suspense to allow useSearchParams to work correctly.
function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data directly from URL params to match the ObservationsPage
  const modelUrl = searchParams.get("modelUrl");
  const patientName = searchParams.get("patientName");
  const modelName = searchParams.get("modelName");

  // Store hooks for UI state
  const { isFullscreen, setFullscreen, toggleFullscreen, isFullscreenSupported } = useViewerStore();

  // UI state management
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [activeTab, setActiveTab] = useState<"properties" | "measurements">("properties");
  const [isMobile, setIsMobile] = useState(false);

  // --- FIX FOR HYDRATION ERROR ---
  // State to track if the component has mounted on the client
  const [isClient, setIsClient] = useState(false);

  // This effect runs only once on the client after mounting
  useEffect(() => {
    setIsClient(true);
  }, []);
  // -----------------------------

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

  // Error handling for missing URL
  if (!modelUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-red-600 bg-red-50 p-8">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error: Model Not Found</h2>
        <p className="mb-6">A valid model URL was not provided. Please return to the patient browser and try again.</p>
        <Link href="/patient-browser"><span className="btn btn-primary">Go Back</span></Link>
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-100">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex-shrink-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0">
            <Link href="/patient-browser" className="p-2 rounded-full hover:bg-neutral-100 transition-colors" title="Back to Patient Browser">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {modelName || '3D Model'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Patient: {patientName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className={clsx("p-2 rounded-lg transition-colors", showSidebar ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100")} title="Toggle Tools">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setShowProperties(!showProperties)} className={clsx("hidden sm:flex p-2 rounded-lg transition-colors", showProperties ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100")} title="Toggle Properties">
              {showProperties ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            
            {/* --- FIX FOR HYDRATION ERROR --- */}
            {/* This button is now wrapped in the `isClient` check */}
            {isClient && isFullscreenSupported() && (
              <button onClick={handleToggleFullscreen} className={clsx("hidden sm:flex p-2 rounded-lg transition-colors", isFullscreen ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100")} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            )}
            {/* ----------------------------- */}

          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {showSidebar && (
          <div className={clsx("flex-shrink-0 z-20", isMobile && "fixed left-0 top-0 h-full")}>
            {isMobile && <div className="fixed inset-0 bg-black bg-opacity-50 z-10" onClick={() => setShowSidebar(false)} />}
            <WorkspaceSidebar
              onClose={() => setShowSidebar(false)}
              onMeasurementToolActivated={() => {
                setActiveTab("measurements");
                setShowProperties(true);
              }}
            />
          </div>
        )}

        <div className="flex-1 relative overflow-hidden bg-black">
          <EnhancedModelViewer
            modelPath={modelUrl}
            showMeasurements={activeTab === "measurements"}
          />
        </div>

        {showProperties && !isMobile && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200 flex flex-col z-20 bg-white">
            <div className="flex bg-gray-50 border-b border-gray-200">
              <button onClick={() => setActiveTab("properties")} className={clsx("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === "properties" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900")}>
                Properties
              </button>
              <button onClick={() => setActiveTab("measurements")} className={clsx("flex-1 px-4 py-3 text-sm font-medium transition-colors", activeTab === "measurements" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900")}>
                Measurements
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === "properties" ? <PropertiesPanel /> : <MeasurementsPanel />}
            </div>
          </div>
        )}
      </main>

      <CalibrationModal />
    </div>
  );
}

// Final export for the page, wrapping the main component in Suspense.
export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}