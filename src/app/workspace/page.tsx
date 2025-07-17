"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import EnhancedModelViewer from '@/components/view/(dashboard)/workspace/EnhancedModelViewer';
import WorkspaceSidebar from '@/components/view/(dashboard)/workspace/Sidebar'; // Import the sidebar you provided
import { Loader, AlertTriangle, ArrowLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const modelUrl = searchParams.get("modelUrl");
  const patientName = searchParams.get("patientName");
  const modelName = searchParams.get("modelName");

  // State to control the visibility of the tools sidebar
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  if (!modelUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-red-600 bg-red-50 p-8">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error: Model Not Found</h2>
        <p className="mb-6">A valid model URL was not provided.</p>
        <button onClick={() => router.back()} className="btn btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-100">
      {/* Header Bar */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 text-gray-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()} 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Back to Patient Profile"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                  <h1 className="font-semibold text-lg">{modelName || '3D Model Viewer'}</h1>
                  <p className="text-sm text-gray-500">{patientName || 'Patient'}</p>
              </div>
          </div>
          <div className="flex items-center">
             <button onClick={() => setSidebarVisible(!isSidebarVisible)} className="btn-secondary flex items-center">
                {isSidebarVisible ? <PanelRightClose className="w-4 h-4 mr-2" /> : <PanelRightOpen className="w-4 h-4 mr-2" />}
                Tools
             </button>
          </div>
      </header>

      {/* Main Content Area with Viewer and Sidebar */}
      <div className="flex-grow flex relative overflow-hidden">
        {/* Main Viewer Area */}
        <div className="flex-1 h-full relative bg-gray-800">
          <EnhancedModelViewer modelPath={modelUrl} />
        </div>
        
        {/* Right Sidebar for Tools and Properties */}
        {isSidebarVisible && (
            <div className="w-80 h-full flex-shrink-0 border-l border-gray-200 bg-white">
                <WorkspaceSidebar 
                  onClose={() => setSidebarVisible(false)} 
                  onMeasurementToolActivated={() => {
                    // This is where you would handle logic for other panels if needed
                    console.log("Measurement tool activated from sidebar");
                  }}
                />
            </div>
        )}
      </div>
    </div>
  );
}

// The main page component that wraps everything in Suspense
export default function WorkspacePage() {
  return (
    <div className="w-screen h-screen">
      <Suspense fallback={
        <div className="h-full flex items-center justify-center bg-gray-800">
          <Loader className="w-12 h-12 animate-spin text-white" />
        </div>
      }>
        <WorkspaceContent />
      </Suspense>
    </div>
  );
}