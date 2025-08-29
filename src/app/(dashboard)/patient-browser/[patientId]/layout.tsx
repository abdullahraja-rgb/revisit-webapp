"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { getPatientDetails } from "@/app/actions/patientActions";
import { FhirPatient } from "@/types/global";
import { ChevronLeft, Plus, Loader, User, AlertTriangle } from "lucide-react";
import { useDashboardModal } from "@/app/(dashboard)/layout";
import { CreateAssessmentForm } from "@/components/view/(dashboard)/Forms";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { PatientContext } from "@/contexts/PatientContext";

// Helper function to format date
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Helper function to calculate age
function calculateAge(dob: string | undefined): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const LoadingState = () => (
    <div className="flex items-center justify-center p-20">
        <div className="text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-lg font-semibold text-gray-600">Loading Patient Record...</p>
        </div>
    </div>
);

const ErrorState = () => (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-red-500/20 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-red-800 mb-2">Error Loading Patient</h3>
        <p className="text-red-700/80">
            The patient record could not be found, or you may not have permission to view it.
        </p>
    </div>
);


export default function PatientProfileLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { openModal, closeModal } = useDashboardModal();
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [patient, setPatient] = useState<FhirPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  useEffect(() => {
    const loadPatient = async () => {
      if (isAuthenticated && patientId) {
        setIsLoading(true);
        try {
          const account = instance.getAllAccounts()[0];
          if (!account) throw new Error("No active account found.");
          const response = await instance.acquireTokenSilent({ ...loginRequest, account });
          const patientData = await getPatientDetails(patientId, response.accessToken);
          setPatient(patientData);
        } catch (error) {
          console.error("Failed to load patient:", error);
          setPatient(null);
        } finally {
          setIsLoading(false);
        }
      } else if (!isAuthenticated) {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId, isAuthenticated, instance]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!patient) {
    return <ErrorState />;
  }

  // --- Data Formatting restored to match your original code ---
  const patientNameData = patient.name?.[0];
  let titleText = "";
  const existingPrefix = patientNameData?.prefix?.[0];
  if (existingPrefix) {
    titleText = existingPrefix;
  } else if (patient.gender) {
    titleText = patient.gender.toLowerCase() === 'male' ? 'Mr' : 'Mrs';
  }
  const title = titleText ? `(${titleText})` : "";
  const formattedPatientName = patientNameData
    ? `${patientNameData.family?.toUpperCase()}, ${patientNameData.given?.join(" ")} ${title}`.trim()
    : "N/A";
  const nhsNumber = patient.identifier?.find(id => id.system?.includes("nhs-number"))?.value || "N/A";
  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "N/A";
  const dob = patient.birthDate;
  const formattedDob = formatDate(dob);
  const age = calculateAge(dob);
  const ageString = age !== null ? `${age} years (${formattedDob})` : formattedDob;

  const handleCreateAssessment = () => {
    openModal(<CreateAssessmentForm onClose={closeModal} patient={patient} />, "2xl");
  };

  const navLinks = [
    { href: `/patient-browser/${patientId}`, text: "Overview" },
    { href: `/patient-browser/${patientId}/observations`, text: "Observations" },
    { href: `/patient-browser/${patientId}/assessments`, text: "Assessments" },
  ];

  return (
    <PatientContext.Provider value={patient}>
      <div className="space-y-4">
        {/* Patient Information Banner - Restored to your exact original format */}
        <div className="bg-gray-200 p-2 flex items-center justify-start space-x-6 text-sm text-gray-900 border-y border-gray-300">
            <p><span className="font-bold">NHS-NO:</span> {nhsNumber}</p>
            <p><span className="font-bold">Patient:</span> {formattedPatientName}</p>
            <p><span className="font-bold">Gender:</span> {gender}</p>
            <p>{ageString}</p>
        </div>

        {/* Main Patient Header Card */}
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-6 space-y-6">
                {/* Top Row: Back Button, Title, and Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/patient-browser" className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-200/60 transition-colors" aria-label="Back to patient browser">
                            <ChevronLeft className="w-6 h-6 text-gray-500" />
                        </Link>
                        <h2 className="text-xl font-semibold text-neutral-800">Patient Record</h2>
                    </div>
                    <button onClick={handleCreateAssessment} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center gap-2 transform hover:-translate-y-0.5">
                        <Plus className="w-4 h-4" />
                        Create Assessment
                    </button>
                </div>

                {/* Tab Navigation */}
                <nav>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
                        {navLinks.map(link => (
                            <Link 
                                key={link.href} 
                                href={link.href}
                                className={`flex-1 text-center px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                                    pathname === link.href
                                    ? "bg-white text-blue-600 shadow-md"
                                    : "text-gray-500 hover:bg-white/60 hover:text-gray-800"
                                }`}
                            >
                                {link.text}
                            </Link>
                        ))}
                    </div>
                </nav>
            </div>
        </div>

        {/* Page Content */}
        <div>{children}</div>
      </div>
    </PatientContext.Provider>
  );
}