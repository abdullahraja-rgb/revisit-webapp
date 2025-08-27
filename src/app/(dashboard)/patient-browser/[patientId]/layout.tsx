"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { getPatientDetails } from "@/app/actions/patientActions";
import { FhirPatient } from "@/types/global";
import { ChevronLeft, Plus, Loader } from "lucide-react";
import { useDashboardModal } from "@/app/(dashboard)/layout";
import { CreateAssessmentForm } from "@/components/view/(dashboard)/Forms";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { PatientContext } from "@/contexts/PatientContext";

// Helper function to format date, updated to match screenshot (e.g., 4 Jun 1962)
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", // Changed from '2-digit'
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
          if (!account) throw new Error("No active account found. Please log in again.");

          const response = await instance.acquireTokenSilent({ ...loginRequest, account });
          const patientData = await getPatientDetails(patientId, response.accessToken);
          setPatient(patientData);
        } catch (error) {
          console.error("Failed to load patient:", error);
          setPatient(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId, isAuthenticated, instance]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Patient not found or you do not have permission to view this record.
      </div>
    );
  }

  // --- Data Formatting ---
  const patientNameData = patient.name?.[0];
  
  // Determine the title. Prefer existing data, otherwise generate from gender.
  let titleText = "";
  const existingPrefix = patientNameData?.prefix?.[0];

  if (existingPrefix) {
    titleText = existingPrefix;
  } else if (patient.gender) {
    if (patient.gender.toLowerCase() === 'male') {
      titleText = 'Mr';
    } else {
      // Per request: "mrs otherwise"
      titleText = 'Mrs';
    }
  }

  const title = titleText ? `(${titleText})` : "";

  // Formats name as: SURNAME, Given (Title) e.g., BLOGGS, Joe (Mr)
  const formattedPatientName = patientNameData
    ? `${patientNameData.family?.toUpperCase()}, ${patientNameData.given?.join(" ")} ${title}`.trim()
    : "N/A";
    
  // Use NHS Number for USRN field
  const nhsNumber = patient.identifier?.find(id => id.system?.includes("nhs-number"))?.value || "N/A";

  // Get and capitalize gender
  const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "N/A";

  const dob = patient.birthDate;
  const formattedDob = formatDate(dob);
  const age = calculateAge(dob);
  // Formats age string as: 56 years (4 Jun 1962)
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
        {/* Patient Information Banner - Styled to replicate the screenshot */}
        <div className="bg-gray-200 p-2 flex items-center justify-start space-x-6 text-sm text-gray-900 border-y border-gray-300">
          <p><span className="font-bold">NHS-NO:</span> {nhsNumber}</p>
          <p><span className="font-bold">Patient:</span> {formattedPatientName}</p>
          <p><span className="font-bold">Gender:</span> {gender}</p>
          <p>{ageString}</p>
        </div>

        {/* This section now includes the back button */}
        <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-2">
                 <Link href="/patient-browser" className="p-2 rounded-full hover:bg-neutral-100" aria-label="Back to patient browser">
                    <ChevronLeft className="w-6 h-6 text-neutral-600" />
                </Link>
                <h2 className="text-xl font-semibold text-neutral-800">Patient Record</h2>
            </div>
            <button onClick={handleCreateAssessment} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
            </button>
        </div>

        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-6">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    pathname === link.href
                      ? "border-primary text-primary"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  {link.text}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </PatientContext.Provider>
  );
}