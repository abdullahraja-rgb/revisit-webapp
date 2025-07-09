"use client";

import { Zap, Sun } from "lucide-react";
import { useViewerStore } from "@/stores/viewerStore";
import { usePatientStore } from "@/stores/patientStore";

export default function PropertiesPanel() {
  const { displayOptions, setDisplayOption, transform, setTransform, modelInfo } = useViewerStore();

  const {} = usePatientStore();

  // Use real model data from store, with fallbacks for when no model is loaded
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const modelInfoDisplay = {
    name: modelInfo?.name || "3D Model",
    format: modelInfo?.format || "GLB",
    version: modelInfo?.version || "2.0",
    size: modelInfo ? formatFileSize(modelInfo.size) : "Unknown",
    optimized: modelInfo?.optimized || false,
    vertices: modelInfo?.vertices || 0,
    faces: modelInfo?.faces || 0,
    materials: modelInfo?.materials || 0,
    textures: modelInfo?.textures || 0,
    animations: modelInfo?.animations || 0,
  };

  const modelDimensions = modelInfo?.dimensions || {
    width: 0,
    depth: 0,
    height: 0,
    surfaceArea: 0,
    volume: 0,
  };

  // Note: Removed selectedDistance as Properties should show static model info, not dynamic measurements

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Model Info */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">MODEL INFO</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Name</label>
              <p className="text-sm font-medium text-gray-900 truncate">{modelInfoDisplay.name}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Format</label>
              <p className="text-sm text-gray-700">
                {modelInfoDisplay.format} /{" "}
                {modelInfoDisplay.format === "GLB" ? "GLTF" : modelInfoDisplay.format}{" "}
                {modelInfoDisplay.version}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Size</label>
              <p className="text-sm text-gray-700">
                {modelInfoDisplay.size} {modelInfoDisplay.optimized && "(Optimized)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Vertices</label>
                <p className="text-sm text-gray-700">
                  {modelInfoDisplay.vertices.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Faces</label>
                <p className="text-sm text-gray-700">{modelInfoDisplay.faces.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Materials</label>
                <p className="text-sm text-gray-700">{modelInfoDisplay.materials}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Textures</label>
                <p className="text-sm text-gray-700">{modelInfoDisplay.textures}</p>
              </div>
            </div>

            {modelInfoDisplay.animations > 0 && (
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Animations</label>
                <p className="text-sm text-gray-700">{modelInfoDisplay.animations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Measurements */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">MEASUREMENTS</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Dimensions</label>
              <p className="text-sm text-gray-700 break-words">
                W: {modelDimensions.width.toFixed(1)} cm x D: {modelDimensions.depth.toFixed(1)} cm
                x H: {modelDimensions.height.toFixed(1)} cm
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">
                  Surface Area
                </label>
                <p className="text-sm text-gray-700">{modelDimensions.surfaceArea.toFixed(2)} m²</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Volume</label>
                <p className="text-sm text-gray-700">{modelDimensions.volume.toFixed(3)} m³</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">TRANSFORM</h3>
          <div className="space-y-4">
            {/* Position */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400">X</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.position[0]}
                    onChange={(e) =>
                      setTransform({
                        position: [
                          parseFloat(e.target.value) || 0,
                          transform.position[1],
                          transform.position[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.position[1]}
                    onChange={(e) =>
                      setTransform({
                        position: [
                          transform.position[0],
                          parseFloat(e.target.value) || 0,
                          transform.position[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Z</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.position[2]}
                    onChange={(e) =>
                      setTransform({
                        position: [
                          transform.position[0],
                          transform.position[1],
                          parseFloat(e.target.value) || 0,
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                Rotation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400">X</label>
                  <input
                    type="number"
                    step="1"
                    value={transform.rotation[0]}
                    onChange={(e) =>
                      setTransform({
                        rotation: [
                          parseFloat(e.target.value) || 0,
                          transform.rotation[1],
                          transform.rotation[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y</label>
                  <input
                    type="number"
                    step="1"
                    value={transform.rotation[1]}
                    onChange={(e) =>
                      setTransform({
                        rotation: [
                          transform.rotation[0],
                          parseFloat(e.target.value) || 0,
                          transform.rotation[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Z</label>
                  <input
                    type="number"
                    step="1"
                    value={transform.rotation[2]}
                    onChange={(e) =>
                      setTransform({
                        rotation: [
                          transform.rotation[0],
                          transform.rotation[1],
                          parseFloat(e.target.value) || 0,
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400">X</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.scale[0]}
                    onChange={(e) =>
                      setTransform({
                        scale: [
                          parseFloat(e.target.value) || 1,
                          transform.scale[1],
                          transform.scale[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Y</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.scale[1]}
                    onChange={(e) =>
                      setTransform({
                        scale: [
                          transform.scale[0],
                          parseFloat(e.target.value) || 1,
                          transform.scale[2],
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Z</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transform.scale[2]}
                    onChange={(e) =>
                      setTransform({
                        scale: [
                          transform.scale[0],
                          transform.scale[1],
                          parseFloat(e.target.value) || 1,
                        ],
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">DISPLAY OPTIONS</h3>
          <div className="space-y-4">
            {/* Toggle Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Grid</label>
                <button
                  onClick={() => setDisplayOption("showGrid", !displayOptions.showGrid)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.showGrid ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.showGrid ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Axis</label>
                <button
                  onClick={() => setDisplayOption("showAxes", !displayOptions.showAxes)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.showAxes ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.showAxes ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Wireframe</label>
                <button
                  onClick={() => setDisplayOption("wireframe", !displayOptions.wireframe)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.wireframe ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.wireframe ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Shadows</label>
                <button
                  onClick={() => setDisplayOption("shadows", !displayOptions.shadows)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.shadows ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.shadows ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Center */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Auto Center Model</label>
              <button
                onClick={() => setDisplayOption("autoCenter", !displayOptions.autoCenter)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  displayOptions.autoCenter ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    displayOptions.autoCenter ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-sm text-gray-700 block mb-2">Background Color</label>
              <input
                type="color"
                value={displayOptions.backgroundColor}
                onChange={(e) => setDisplayOption("backgroundColor", e.target.value)}
                className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Ambient Light */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Ambient Light</label>
                <button
                  onClick={() => setDisplayOption("ambientLight", !displayOptions.ambientLight)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.ambientLight ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.ambientLight ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {displayOptions.ambientLight && (
                <div className="flex items-center space-x-3">
                  <Sun className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={displayOptions.ambientLightIntensity}
                    onChange={(e) =>
                      setDisplayOption("ambientLightIntensity", parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                    {displayOptions.ambientLightIntensity.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Directional Light */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Directional Light</label>
                <button
                  onClick={() =>
                    setDisplayOption("directionalLight", !displayOptions.directionalLight)
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.directionalLight ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.directionalLight ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {displayOptions.directionalLight && (
                <div className="flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={displayOptions.directionalLightIntensity}
                    onChange={(e) =>
                      setDisplayOption("directionalLightIntensity", parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                    {displayOptions.directionalLightIntensity.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Point Light */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Point Light</label>
                <button
                  onClick={() => setDisplayOption("pointLight", !displayOptions.pointLight)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.pointLight ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.pointLight ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {displayOptions.pointLight && (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full flex-shrink-0"></div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={displayOptions.pointLightIntensity}
                    onChange={(e) =>
                      setDisplayOption("pointLightIntensity", parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                    {displayOptions.pointLightIntensity.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Spot Light */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">Spot Light</label>
                <button
                  onClick={() => setDisplayOption("spotLight", !displayOptions.spotLight)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    displayOptions.spotLight ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      displayOptions.spotLight ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {displayOptions.spotLight && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-400 rounded-full flex-shrink-0"></div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={displayOptions.spotLightIntensity}
                      onChange={(e) =>
                        setDisplayOption("spotLightIntensity", parseFloat(e.target.value))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                      {displayOptions.spotLightIntensity.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 w-4 flex-shrink-0">Angle</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={displayOptions.spotLightAngle}
                      onChange={(e) =>
                        setDisplayOption("spotLightAngle", parseFloat(e.target.value))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                      {displayOptions.spotLightAngle.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Options */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                Grid & Axis
              </h4>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 w-12 flex-shrink-0">Size</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={displayOptions.gridSize}
                  onChange={(e) => setDisplayOption("gridSize", parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
                  {displayOptions.gridSize}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-500 w-12 flex-shrink-0">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={displayOptions.gridOpacity}
                  onChange={(e) => setDisplayOption("gridOpacity", parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
                  {Math.round(displayOptions.gridOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
