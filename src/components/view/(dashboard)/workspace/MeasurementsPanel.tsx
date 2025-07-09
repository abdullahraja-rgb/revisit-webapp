"use client";

import React, { useState, useEffect } from "react";
import { useViewerStore } from "@/stores/viewerStore";

const MeasurementsPanel: React.FC = () => {
  const {
    measurements,
    removeMeasurement,
    clearMeasurements,
    isFullscreen,
    unitConversionFactor,
    setUnitConversionFactor,
  } = useViewerStore();

  const [isEditingFactor, setIsEditingFactor] = useState(false);
  const [tempFactor, setTempFactor] = useState(unitConversionFactor.toString());

  // Sync tempFactor with unitConversionFactor when it changes
  useEffect(() => {
    setTempFactor(unitConversionFactor.toString());
  }, [unitConversionFactor]);

  const getMeasurementIcon = (type: string) => {
    switch (type) {
      case "distance":
        return "📏";
      case "angle":
        return "📐";
      case "area":
        return "⬜";
      default:
        return "📏";
    }
  };

  const getMeasurementColor = (type: string) => {
    switch (type) {
      case "distance":
        return "text-red-600";
      case "angle":
        return "text-orange-600";
      case "area":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const formatCoordinate = (point: [number, number, number]) => {
    return `(${point[0].toFixed(2)}, ${point[1].toFixed(2)}, ${point[2].toFixed(2)})`;
  };

  const handleFactorUpdate = () => {
    const newFactor = parseFloat(tempFactor);
    if (!isNaN(newFactor) && newFactor > 0) {
      setUnitConversionFactor(newFactor);
      setIsEditingFactor(false);
    } else {
      alert("Please enter a valid positive number");
    }
  };

  const handleFactorCancel = () => {
    setTempFactor(unitConversionFactor.toString());
    setIsEditingFactor(false);
  };

  return (
    <div
      className={`h-full overflow-y-auto transition-all ${
        isFullscreen
          ? "bg-black bg-opacity-80 text-white backdrop-blur-sm border-l border-gray-600"
          : "bg-white border-l border-gray-200"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isFullscreen ? "text-white" : "text-gray-900"}`}>
            Measurements
          </h3>
          {measurements.length > 0 && (
            <button
              onClick={clearMeasurements}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Clear all measurements"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Conversion Factor Settings */}
        <div
          className={`mb-4 p-3 rounded-lg ${
            isFullscreen ? "bg-gray-800 bg-opacity-40" : "bg-blue-50"
          }`}
        >
          <h4
            className={`text-sm font-medium mb-2 ${
              isFullscreen ? "text-blue-300" : "text-blue-800"
            }`}
          >
            🔧 Conversion Settings
          </h4>
          <div className={`text-xs space-y-2 ${isFullscreen ? "text-gray-300" : "text-blue-700"}`}>
            <div className="flex items-center justify-between">
              <span>Conversion Factor:</span>
              {isEditingFactor ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={tempFactor}
                    onChange={(e) => setTempFactor(e.target.value)}
                    className={`w-20 px-2 py-1 text-xs rounded border ${
                      isFullscreen
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <button
                    onClick={handleFactorUpdate}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleFactorCancel}
                    className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{unitConversionFactor.toFixed(1)}</span>
                  <button
                    onClick={() => {
                      setIsEditingFactor(true);
                      setTempFactor(unitConversionFactor.toString());
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Formula: Model Distance × {unitConversionFactor.toFixed(1)} = Real Distance
            </div>
          </div>
        </div>

        {measurements.length === 0 ? (
          <div className={`text-center py-8 ${isFullscreen ? "text-gray-300" : "text-gray-500"}`}>
            <div className="text-4xl mb-2">📏</div>
            <p className="text-sm">No measurements taken yet</p>
            <p className="text-xs mt-1">Use the measurement tools on the left to start measuring</p>
          </div>
        ) : (
          <div className="space-y-3">
            {measurements.map((measurement, index) => (
              <div
                key={measurement.id}
                className={`p-3 rounded-lg border transition-all ${
                  isFullscreen
                    ? "bg-gray-800 bg-opacity-60 border-gray-600"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getMeasurementIcon(measurement.type)}</span>
                    <div>
                      <h4
                        className={`font-medium text-sm ${
                          isFullscreen ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)} #
                        {index + 1}
                      </h4>
                      <p className={`text-xs ${getMeasurementColor(measurement.type)} font-medium`}>
                        {measurement.label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMeasurement(measurement.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove this measurement"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className={`text-xs space-y-1 ${
                    isFullscreen ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <div className="font-medium">Points:</div>
                  {measurement.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="ml-2">
                      <span className="font-mono text-xs">
                        Point {pointIndex + 1}: {formatCoordinate(point)}
                      </span>
                    </div>
                  ))}

                  {measurement.type === "distance" && (
                    <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                      <div>
                        <span className="font-medium">Raw Distance: </span>
                        <span className="font-mono">
                          {(measurement.value / unitConversionFactor).toFixed(3)} units
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Real Distance: </span>
                        <span className="font-mono">{measurement.value.toFixed(2)} m</span>
                      </div>
                    </div>
                  )}

                  {measurement.type === "angle" && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <span className="font-medium">Angle: </span>
                      <span className="font-mono">{measurement.value.toFixed(2)}°</span>
                    </div>
                  )}

                  {measurement.type === "area" && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <span className="font-medium">Area: </span>
                      <span className="font-mono">{measurement.value.toFixed(3)} m²</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {measurements.length > 0 && (
          <div
            className={`mt-6 p-3 rounded-lg ${
              isFullscreen ? "bg-gray-800 bg-opacity-40" : "bg-green-50"
            }`}
          >
            <h4
              className={`text-sm font-medium mb-2 ${
                isFullscreen ? "text-green-300" : "text-green-800"
              }`}
            >
              Summary
            </h4>
            <div
              className={`text-xs space-y-1 ${isFullscreen ? "text-gray-300" : "text-green-700"}`}
            >
              <div>Total measurements: {measurements.length}</div>
              <div>
                Distance: {measurements.filter((m) => m.type === "distance").length} | Angle:{" "}
                {measurements.filter((m) => m.type === "angle").length} | Area:{" "}
                {measurements.filter((m) => m.type === "area").length}
              </div>
              <div className="text-green-600 font-medium">
                🎯 Using conversion factor: {unitConversionFactor.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementsPanel;
