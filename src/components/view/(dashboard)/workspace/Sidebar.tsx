"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  RotateCcw,
  Move,
  ZoomIn,
  RotateCw,
  Ruler,
  Triangle,
  Square,
  MousePointer,
  Box,
  Minus,
  Circle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useViewerStore, type ModelHierarchy } from "@/stores/viewerStore";
import { usePatientStore } from "@/stores/patientStore";
import { clsx } from "clsx";

interface WorkspaceSidebarProps {
  onClose?: () => void;
  onMeasurementToolActivated?: () => void;
}

export default function WorkspaceSidebar({
  onClose,
  onMeasurementToolActivated,
}: WorkspaceSidebarProps) {
  const {
    activeTools,
    setActiveTool,
    toggleMeasurementTool,
    selectionMode,
    setSelectionMode,
    // resetTools,
    resetCamera,
    modelHierarchy,
    toggleHierarchyVisibility,
  } = useViewerStore();

  const { toggleUploadModal } = usePatientStore();

  const [hierarchyExpanded, setHierarchyExpanded] = useState<Record<string, boolean>>({});

  // Track if we've already auto-expanded to prevent re-expansion
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto-expand root node when model hierarchy is loaded (only once)
  useEffect(() => {
    if (modelHierarchy && !hasAutoExpanded) {
      // Initialize all nodes with default collapsed state, except root
      const initializeExpanded = (node: ModelHierarchy, isRoot = true): Record<string, boolean> => {
        const expanded: Record<string, boolean> = {};
        expanded[node.id] = isRoot; // Only root starts expanded

        if (node.children) {
          node.children.forEach((child: ModelHierarchy) => {
            const childExpanded = initializeExpanded(child, false);
            Object.assign(expanded, childExpanded);
          });
        }

        return expanded;
      };

      const initialExpanded = initializeExpanded(modelHierarchy);
      setHierarchyExpanded(initialExpanded);
      setHasAutoExpanded(true);
    }
  }, [modelHierarchy, hasAutoExpanded]);

  // Reset auto-expansion when model changes
  useEffect(() => {
    if (!modelHierarchy) {
      setHasAutoExpanded(false);
      setHierarchyExpanded({});
    }
  }, [modelHierarchy?.id]);

  const toggleHierarchyItem = (id: string) => {
    setHierarchyExpanded((prev) => ({
      ...prev,
      [id]: !prev[id], // If undefined, !undefined = true, so it will expand
    }));
  };

  // Recursive component to render hierarchy tree
  const HierarchyNode = ({
    node,
    depth = 0,
  }: {
    node: ModelHierarchy & { type?: string; isMesh?: boolean };
    depth?: number;
  }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = hierarchyExpanded[node.id];
    const indentClass = depth === 0 ? "" : `ml-${Math.min(depth * 3, 12)}`;

    // Choose icon based on type
    const getNodeIcon = () => {
      if (node.isMesh) {
        return <Box className={`w-4 h-4 ${node.visible ? "text-green-500" : "text-gray-400"}`} />;
      } else if (node.type === "Group") {
        return (
          <Box
            className={`w-4 h-4 ${depth === 0 ? "text-blue-500" : "text-blue-400"} ${
              !node.visible ? "opacity-50" : ""
            }`}
          />
        );
      } else {
        return <Circle className={`w-4 h-4 ${node.visible ? "text-gray-600" : "text-gray-300"}`} />;
      }
    };

    return (
      <div key={node.id}>
        <div
          className={`flex items-center space-x-2 ${indentClass} py-1 hover:bg-gray-50 rounded transition-colors ${
            !node.visible ? "opacity-60" : ""
          }`}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleHierarchyItem(node.id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {getNodeIcon()}

          <span
            className={`text-sm flex-1 truncate ${
              depth === 0 ? "font-medium text-gray-900" : "text-gray-700"
            } ${!node.visible ? "line-through opacity-60" : ""}`}
            title={node.name}
          >
            {node.name}
          </span>

          {/* Type indicator */}
          {node.isMesh && (
            <span
              className={`text-xs px-1 rounded ${
                node.visible ? "text-green-600 bg-green-100" : "text-gray-500 bg-gray-100"
              }`}
            >
              Mesh
            </span>
          )}

          {!node.isMesh && node.children && (
            <span
              className={`text-xs px-1 rounded ${
                node.visible ? "text-blue-600 bg-blue-100" : "text-gray-500 bg-gray-100"
              }`}
            >
              Group
            </span>
          )}

          <button
            onClick={() => toggleHierarchyVisibility(node.id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={node.visible ? "Hide object" : "Show object"}
            aria-label={node.visible ? "Hide" : "Show"}
          >
            {node.visible ? (
              <Eye className="w-3 h-3 text-gray-500" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => (
              <HierarchyNode
                key={child.id}
                node={child as ModelHierarchy & { type?: string; isMesh?: boolean }}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header - Mobile only */}
      {onClose && (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Upload Model Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={toggleUploadModal}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">Upload Model</span>
          </button>
        </div>

        {/* View Tools */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">View Tools</h3>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTool("orbit", !activeTools.orbit)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.orbit ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Orbit</span>
            </button>

            <button
              onClick={() => setActiveTool("pan", !activeTools.pan)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.pan ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Move className="w-4 h-4" />
              <span className="text-sm">Pan</span>
            </button>

            <button
              onClick={() => setActiveTool("zoom", !activeTools.zoom)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.zoom ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-sm">Zoom</span>
            </button>

            <button
              onClick={resetCamera}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-sm">Reset View</span>
            </button>
          </div>
        </div>

        {/* Measurement Tools */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Measurement Tools</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                toggleMeasurementTool("distance");
                onMeasurementToolActivated?.();
              }}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.measure && activeTools.measurementType === "distance"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Ruler className="w-4 h-4" />
              <span className="text-sm">Distance</span>
              {activeTools.measure && activeTools.measurementType === "distance" && (
                <span className="ml-auto text-xs text-green-600">Active</span>
              )}
            </button>

            <button
              onClick={() => {
                toggleMeasurementTool("angle");
                onMeasurementToolActivated?.();
              }}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.measure && activeTools.measurementType === "angle"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Triangle className="w-4 h-4" />
              <span className="text-sm">Angle</span>
              {activeTools.measure && activeTools.measurementType === "angle" && (
                <span className="ml-auto text-xs text-green-600">Active</span>
              )}
            </button>

            <button
              onClick={() => {
                toggleMeasurementTool("area");
                onMeasurementToolActivated?.();
              }}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                activeTools.measure && activeTools.measurementType === "area"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Square className="w-4 h-4" />
              <span className="text-sm">Area</span>
              {activeTools.measure && activeTools.measurementType === "area" && (
                <span className="ml-auto text-xs text-green-600">Active</span>
              )}
            </button>
          </div>
        </div>

        {/* Selection Tools */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Selection Tools</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectionMode("select", !selectionMode.select)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                selectionMode.select
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <MousePointer className="w-4 h-4" />
              <span className="text-sm">Select</span>
            </button>

            <button
              onClick={() => setSelectionMode("face", !selectionMode.face)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                selectionMode.face
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Box className="w-4 h-4" />
              <span className="text-sm">Face</span>
            </button>

            <button
              onClick={() => setSelectionMode("edge", !selectionMode.edge)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                selectionMode.edge
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Minus className="w-4 h-4" />
              <span className="text-sm">Edge</span>
            </button>

            <button
              onClick={() => setSelectionMode("vertex", !selectionMode.vertex)}
              className={clsx(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                selectionMode.vertex
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Circle className="w-4 h-4" />
              <span className="text-sm">Vertex</span>
            </button>
          </div>
        </div>

        {/* Model Hierarchy */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Model Hierarchy</h3>
          <div className="space-y-1">
            {modelHierarchy ? (
              <HierarchyNode
                node={modelHierarchy as ModelHierarchy & { type?: string; isMesh?: boolean }}
              />
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Loading model hierarchy...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
