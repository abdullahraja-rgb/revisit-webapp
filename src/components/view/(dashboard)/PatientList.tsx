"use client";

import { useState } from "react";
import { Search, Calendar, User, Play, Eye, Download } from "lucide-react";
import { Patient, Model } from "../../../../types/global";
import { clsx } from "clsx";

interface PatientListProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient) => void;
  onModelSelect: (model: Model) => void;
}

export function PatientList({
  patients,
  selectedPatient,
  onPatientSelect,
  onModelSelect,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex">
      {/* Patient List Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient List</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pri-lighter focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => onPatientSelect(patient)}
                className={clsx(
                  "p-4 border-b border-gray-100 cursor-pointer transition-colors",
                  selectedPatient?.id === patient.id
                    ? "bg-pri-lighter/10 border-l-4 border-l-pri-lighter"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">Age: {patient.age}</p>
                      <p className="text-sm text-gray-500">{patient.condition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {patient.lastAssessment}
                    </div>
                    <div className="mt-1 text-xs text-pri-light">
                      {patient.models.length} model{patient.models.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-md font-medium text-gray-700 mb-1">
                  {patients.length === 0 ? "No Patients Available" : "No Patients Found"}
                </h3>
                <p className="text-sm text-gray-500">
                  {patients.length === 0
                    ? "Patient data is being loaded or no patients have been uploaded yet."
                    : "Try adjusting your search terms to find patients."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Grid Panel */}
      <div className="flex-1 bg-gray-50">
        {selectedPatient ? (
          <div className="h-full flex flex-col">
            <div className="bg-white p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedPatient.name}&apos;s 3D Models
              </h2>
              <p className="text-gray-600 mt-1">Click on any model to view in 3D viewer</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedPatient.models.map((model) => (
                  <div
                    key={model.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onModelSelect(model)}
                  >
                    <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-pri-lighter/10 rounded-lg flex items-center justify-center">
                        <Play className="w-6 h-6 text-pri" />
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{model.name}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-2" />
                          {model.captureDate}
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-2" />
                          {model.room}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onModelSelect(model);
                          }}
                          className="px-3 py-1.5 bg-pri text-white text-sm rounded-lg hover:bg-pri-lighter transition-colors"
                        >
                          View 3D
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
              <p className="text-gray-600">
                Choose a patient from the list to view their 3D models
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
