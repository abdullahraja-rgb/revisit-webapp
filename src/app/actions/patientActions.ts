"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";
import { FhirPatient } from "@/types/global";

// Define the shape of the data coming from the patient creation form
type PatientFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  nhsNumber: string | null;
  mrn: string | null;
  phone: string;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
};

/**
 * Creates a new patient resource.
 * @param data - The form data.
 * @param authToken - The user's valid access token.
 */
export async function createPatient(data: PatientFormData, authToken: string) {
  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }

  const url = `${python_url}/patient`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create patient.');
    }
    
    revalidatePath("/patient-browser"); 
    return { success: true, message: "Patient created successfully!" };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

/**
 * Fetches the full details for a single patient from the backend.
 * @param patientId - The ID of the patient to fetch.
 * @param authToken - The user's valid access token.
 */
export async function getPatientDetails(patientId: string, authToken: string): Promise<FhirPatient | null> {
  if (!authToken) {
    console.error("getPatientDetails failed: User is not authenticated.");
    return null;
  }

  const url = `${python_url}/patient/${patientId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch patient details.');
    }

    const data = await response.json();
    return data.patient;

  } catch (error) {
    console.error("Error fetching patient details:", error);
    return null;
  }
}