"use client";

import { useRouter } from "next/navigation";
import { CloudIntegration } from "@/components/view/(dashboard)/CloudIntegration";
import { PatientList } from "@/components/view/(dashboard)/PatientList";
import { usePatientStore } from "@/stores/patientStore";
import { Patient, Model } from "../../../types/global";

export default function Home() {
  const router = useRouter();
  const { patients, selectedPatient, showCloudIntegration, setSelectedPatient } = usePatientStore();

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleModelSelect = (model: Model) => {
    if (!selectedPatient) return;

    // Navigate to workspace with URL parameters
    const params = new URLSearchParams({
      patient: selectedPatient.id,
      model: model.id,
    });

    router.push(`/workspace?${params.toString()}`);
  };

  const handleCloudFileSelect = (file: { name: string; size: number; type: string }) => {
    console.log("Cloud file selected:", file);
    // TODO: Handle cloud file selection when implemented
  };

  return (
    <main className="flex-1 overflow-hidden flex h-full">
      <div className="flex-1 min-w-0">
        <PatientList
          patients={patients}
          selectedPatient={selectedPatient}
          onPatientSelect={handlePatientSelect}
          onModelSelect={handleModelSelect}
        />
      </div>

      {showCloudIntegration && selectedPatient && (
        <div className="w-80 max-w-[33vw] border-l border-gray-200 p-4 flex-shrink-0 overflow-y-auto">
          <CloudIntegration patientId={selectedPatient.id} onFileSelect={handleCloudFileSelect} />
        </div>
      )}
    </main>
  );
}
