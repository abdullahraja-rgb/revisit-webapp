"use client";

import React, { useState } from "react";
import { useViewerStore } from "@/stores/viewerStore";

const CalibrationModal: React.FC = () => {
  const { showCalibrationModal, setShowCalibrationModal, setCalibration, measurements } =
    useViewerStore();

  const [actualMeasurement, setActualMeasurement] = useState("");
  const [deviceMeasurement, setDeviceMeasurement] = useState("");

  // Get the first distance measurement (which triggered this modal)
  const firstDistanceMeasurement = measurements.find((m) => m.type === "distance");
  const measuredValue = firstDistanceMeasurement?.value || 0;

  const handleCalibrate = () => {
    const actual = parseFloat(actualMeasurement);
    const device = parseFloat(deviceMeasurement);

    if (isNaN(actual) || actual <= 0) {
      alert("Please enter a valid positive number for the actual measurement.");
      return;
    }

    if (isNaN(device) || device <= 0) {
      alert("Please enter a valid positive number for the other device measurement.");
      return;
    }

    // Set calibration using the formula: (actual / other device)
    // This factor will be applied to future measurements
    setCalibration(actual, device);
    setShowCalibrationModal(false);

    // Reset form
    setActualMeasurement("");
    setDeviceMeasurement("");
  };

  const handleSkip = () => {
    setShowCalibrationModal(false);
    setActualMeasurement("");
    setDeviceMeasurement("");
  };

  if (!showCalibrationModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📏</span>
          <h2 className="text-xl font-bold text-gray-900">Calibrate Measurements</h2>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>First measurement detected!</strong>
            <br />
            To ensure accurate measurements, please calibrate the system by providing the actual
            measurement.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">Our measurement:</label>
            <div className="text-lg font-mono text-gray-900">{measuredValue.toFixed(3)} m</div>
            <p className="text-xs text-gray-500 mt-1">
              This is what we calculated from your points
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual measurement:
            </label>
            <div className="flex">
              <input
                type="number"
                step="any"
                value={actualMeasurement}
                onChange={(e) => setActualMeasurement(e.target.value)}
                placeholder="Enter actual distance"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500">
                m
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">What you know this distance actually is</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other device measurement:
            </label>
            <div className="flex">
              <input
                type="number"
                step="any"
                value={deviceMeasurement}
                onChange={(e) => setDeviceMeasurement(e.target.value)}
                placeholder="Enter measurement from another device"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500">
                m
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              What another measuring device shows for the same distance
            </p>
          </div>

          {actualMeasurement && deviceMeasurement && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Calibration factor:</strong>{" "}
                {(parseFloat(actualMeasurement) / parseFloat(deviceMeasurement)).toFixed(4)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Formula: ({actualMeasurement} ÷ {deviceMeasurement}) × our_measurement
              </p>
              <p className="text-xs text-green-600">
                Future measurements will be multiplied by this factor
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Skip Calibration
          </button>
          <button
            onClick={handleCalibrate}
            disabled={!actualMeasurement || !deviceMeasurement}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Calibrate
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalibrationModal;
