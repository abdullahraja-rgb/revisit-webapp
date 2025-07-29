"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import EnhancedModelViewer from '@/components/view/(dashboard)/workspace/EnhancedModelViewer';
import MeasurementsPanel from '@/components/view/(dashboard)/workspace/MeasurementsPanel';
import PropertiesPanel from '@/components/view/(dashboard)/workspace/PropertiesPanel';
import WorkspaceSidebar from '@/components/view/(dashboard)/workspace/Sidebar';
import { Loader, AlertTriangle, ChevronLeft, PanelRightClose, PanelRightOpen, LayoutGrid, Ruler, Info } from 'lucide-react';
import { clsx } from 'clsx';

// This is the main content component for the workspace
function WorkspaceContent() {
  const searchParams = useSearchParams();
  
  const modelUrl = searchParams.get("modelUrl");
  const patientName = searchParams.get("patientName");
  const modelName = searchParams.get("modelName");

  // State to control the visibility of the entire sidebar
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  // State to control which tab is active within the sidebar
  const [activeTab, setActiveTab] = useState<'tools' | 'measurements' | 'properties'>('tools');

  if (!modelUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-red-600 bg-red-50 p-8">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error: Model Not Found</h2>
        <p className="mb-6">A valid model URL was not provided.</p>
        <Link href="/patient-browser"><span className="btn btn-primary">Go Back</span></Link>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-neutral-100">
      {/* Header Bar */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-neutral-200 text-neutral-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
              <Link href="/patient-browser" className="p-2 rounded-full hover:bg-neutral-100 transition-colors" title="Back to Patient Browser">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                  <h1 className="font-semibold text-lg">{modelName || '3D Model Viewer'}</h1>
                  <p className="text-sm text-neutral-500">Patient: {patientName || 'N/A'}</p>
              </div>
          </div>
          <div className="flex items-center">
             <button onClick={() => setSidebarVisible(!isSidebarVisible)} className="btn-secondary flex items-center">
                {isSidebarVisible ? <PanelRightClose className="w-4 h-4 mr-2" /> : <PanelRightOpen className="w-4 h-4 mr-2" />}
                Panels
             </button>
          </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex relative overflow-hidden">
        {/* Main Viewer */}
        <div className="flex-1 h-full relative bg-neutral-800">
          <EnhancedModelViewer modelPath={modelUrl} />
        </div>
        
        {/* Right Sidebar with Tabbed Interface */}
        {isSidebarVisible && (
            <div className="w-80 h-full flex flex-col flex-shrink-0 border-l border-neutral-200 bg-white">
                {/* Tab Navigation */}
                <div className="flex-shrink-0 border-b border-neutral-200">
                    <nav className="flex space-x-2 p-2">
                        <button onClick={() => setActiveTab('tools')} className={clsx("flex-1 btn btn-secondary text-xs", { 'bg-neutral-200': activeTab === 'tools' })}><LayoutGrid className="w-4 h-4 mr-1" /> Tools</button>
                        <button onClick={() => setActiveTab('measurements')} className={clsx("flex-1 btn btn-secondary text-xs", { 'bg-neutral-200': activeTab === 'measurements' })}><Ruler className="w-4 h-4 mr-1" /> Measurements</button>
                        <button onClick={() => setActiveTab('properties')} className={clsx("flex-1 btn btn-secondary text-xs", { 'bg-neutral-200': activeTab === 'properties' })}><Info className="w-4 h-4 mr-1" /> Properties</button>
                    </nav>
                </div>
                
                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto">
                    {activeTab === 'tools' && <WorkspaceSidebar />}
                    {activeTab === 'measurements' && <MeasurementsPanel />}
                    {activeTab === 'properties' && <PropertiesPanel />}
                </div>
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
        <div className="h-full flex items-center justify-center bg-neutral-800">
          <Loader className="w-12 h-12 animate-spin text-white" />
        </div>
      }>
        <WorkspaceContent />
      </Suspense>
    </div>
  );
}