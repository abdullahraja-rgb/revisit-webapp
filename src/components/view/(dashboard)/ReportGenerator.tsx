"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { Patient, Model } from "../../../../types/global";

interface AdvancedMeasurement {
  id: string;
  type: string;
  value: number;
  unit: string;
  label: string;
  points: [number, number, number][];
}

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  model: Model;
  measurements: AdvancedMeasurement[];
}

interface ReportData {
  therapistName: string;
  therapistCredentials: string;
  assessmentDate: string;
  assessmentType: "initial" | "follow-up" | "final";
  recommendations: string;
  safetyRisks: string;
  modifications: string;
  notes: string;
}

export function ReportGenerator({
  isOpen,
  onClose,
  patient,
  model,
  measurements,
}: ReportGeneratorProps) {
  const [reportData, setReportData] = useState<ReportData>({
    therapistName: "",
    therapistCredentials: "OTR/L",
    assessmentDate: new Date().toISOString().split("T")[0],
    assessmentType: "initial",
    recommendations: "",
    safetyRisks: "",
    modifications: "",
    notes: "",
  });

  const [reportFormat, setReportFormat] = useState<"pdf" | "html" | "doc">("pdf");

  const updateReportData = (field: keyof ReportData, value: string) => {
    setReportData((prev) => ({ ...prev, [field]: value }));
  };

  const generateReport = () => {
    const reportContent = createReportHTML();

    if (reportFormat === "html") {
      downloadHTMLReport(reportContent);
    } else if (reportFormat === "pdf") {
      // In a real implementation, you'd use a library like jsPDF or html2pdf
      alert("PDF generation would be implemented with jsPDF library");
    } else {
      // DOC format
      alert("DOC generation would be implemented with docx library");
    }
  };

  const createReportHTML = () => {
    const distanceMeasurements = measurements.filter((m) => m.type === "distance");
    const angleMeasurements = measurements.filter((m) => m.type === "angle");
    const areaMeasurements = measurements.filter((m) => m.type === "area");

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Occupational Therapy Home Assessment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { display: flex; }
        .info-label { font-weight: bold; margin-right: 10px; min-width: 120px; }
        .measurements { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .measurement-item { margin-bottom: 10px; }
        .recommendations { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; }
        .safety-risks { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Occupational Therapy Home Assessment Report</h1>
        <p>3D Model-Based Environmental Assessment</p>
    </div>

    <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Name:</span>
                <span>${patient.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Age:</span>
                <span>${patient.age} years</span>
            </div>
            <div class="info-item">
                <span class="info-label">Condition:</span>
                <span>${patient.condition}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Assessment Date:</span>
                <span>${reportData.assessmentDate}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Therapist Information</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Therapist:</span>
                <span>${reportData.therapistName}, ${reportData.therapistCredentials}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Assessment Type:</span>
                <span>${
                  reportData.assessmentType.charAt(0).toUpperCase() +
                  reportData.assessmentType.slice(1)
                } Assessment</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">3D Model Assessment</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Room/Area:</span>
                <span>${model.room}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Capture Date:</span>
                <span>${model.captureDate}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Environmental Measurements</div>
        <div class="measurements">
            ${
              distanceMeasurements.length > 0
                ? `
            <h4>Distance Measurements:</h4>
            ${distanceMeasurements
              .map(
                (m) => `
            <div class="measurement-item">
                • ${m.label}: ${m.value.toFixed(2)} ${m.unit}
            </div>
            `
              )
              .join("")}
            `
                : ""
            }
            
            ${
              angleMeasurements.length > 0
                ? `
            <h4>Angle Measurements:</h4>
            ${angleMeasurements
              .map(
                (m) => `
            <div class="measurement-item">
                • ${m.label}: ${m.value.toFixed(1)}°
            </div>
            `
              )
              .join("")}
            `
                : ""
            }
            
            ${
              areaMeasurements.length > 0
                ? `
            <h4>Area Measurements:</h4>
            ${areaMeasurements
              .map(
                (m) => `
            <div class="measurement-item">
                • ${m.label}: ${m.value.toFixed(2)} ${m.unit}
            </div>
            `
              )
              .join("")}
            `
                : ""
            }
            
            ${
              measurements.length === 0
                ? "<p>No measurements recorded during this assessment.</p>"
                : ""
            }
        </div>
    </div>

    ${
      reportData.safetyRisks
        ? `
    <div class="section">
        <div class="section-title">Safety Risks Identified</div>
        <div class="safety-risks">
            ${reportData.safetyRisks.replace(/\n/g, "<br>")}
        </div>
    </div>
    `
        : ""
    }

    <div class="section">
        <div class="section-title">Recommendations & Modifications</div>
        <div class="recommendations">
            ${reportData.recommendations || "No specific recommendations documented."}
        </div>
    </div>

    ${
      reportData.modifications
        ? `
    <div class="section">
        <div class="section-title">Recommended Environmental Modifications</div>
        <div>
            ${reportData.modifications.replace(/\n/g, "<br>")}
        </div>
    </div>
    `
        : ""
    }

    ${
      reportData.notes
        ? `
    <div class="section">
        <div class="section-title">Additional Notes</div>
        <div>
            ${reportData.notes.replace(/\n/g, "<br>")}
        </div>
    </div>
    `
        : ""
    }

    <div class="footer">
        <p>Report generated on ${new Date().toLocaleDateString()} using OCTALOOP 3D Home Assessment Platform</p>
        <p>This assessment was conducted using LiDAR-captured 3D models for enhanced accuracy and remote evaluation capability.</p>
    </div>
</body>
</html>
    `;
  };

  const downloadHTMLReport = (content: string) => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OT_Assessment_${patient.name.replace(/\s+/g, "_")}_${
      reportData.assessmentDate
    }.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Assessment Report</h2>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {patient.name} | Room: {model.room}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Therapist Name *
                    </label>
                    <input
                      type="text"
                      value={reportData.therapistName}
                      onChange={(e) => updateReportData("therapistName", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credentials
                    </label>
                    <input
                      type="text"
                      value={reportData.therapistCredentials}
                      onChange={(e) => updateReportData("therapistCredentials", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., OTR/L, MS"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment Type
                    </label>
                    <select
                      value={reportData.assessmentType}
                      onChange={(e) => updateReportData("assessmentType", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="initial">Initial Assessment</option>
                      <option value="follow-up">Follow-up Assessment</option>
                      <option value="final">Final Assessment</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Safety Risks Identified
                    </label>
                    <textarea
                      value={reportData.safetyRisks}
                      onChange={(e) => updateReportData("safetyRisks", e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Document any safety concerns observed..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommendations
                    </label>
                    <textarea
                      value={reportData.recommendations}
                      onChange={(e) => updateReportData("recommendations", e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your professional recommendations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Environmental Modifications
                    </label>
                    <textarea
                      value={reportData.modifications}
                      onChange={(e) => updateReportData("modifications", e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Suggested modifications for home environment..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={reportData.notes}
                      onChange={(e) => updateReportData("notes", e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Any additional observations or notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{model.room}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Measurements:</span>
                    <span className="font-medium">{measurements.length} recorded</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Assessment Date:</span>
                    <span className="font-medium">{reportData.assessmentDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["pdf", "html", "doc"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setReportFormat(format)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            reportFormat === format
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {measurements.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Recorded Measurements</h4>
                  <div className="space-y-2 text-sm">
                    {measurements.map((measurement, index) => (
                      <div key={measurement.id} className="flex justify-between">
                        <span className="text-gray-600">
                          {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}{" "}
                          {index + 1}:
                        </span>
                        <span className="font-medium">
                          {measurement.value.toFixed(2)}
                          {measurement.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Report will include patient info, measurements, and recommendations
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={generateReport}
              disabled={!reportData.therapistName}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
