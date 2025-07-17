// src/app/actions/patientSearchActions.ts
"use server";

import { python_url } from "@/constants/ApiConstants";
import { FhirPatient } from "@/types/global"; // Assuming you have this type

/**
 * Searches for patients by sending a query to the backend.
 * @param query - The search term (e.g., name, DOB, NHS number).
 * @returns A list of matching FHIR Patient resources.
 */
export async function searchPatients(query: string): Promise<FhirPatient[]> {
  // The backend endpoint for searching patients
  const url = new URL(`${python_url}/search/patients`);
  url.searchParams.append("q", query); // Add the query as a URL parameter

  // For testing, we'll use the hardcoded token.
  const authToken = "fake-practitioner-token-leeds";

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to search patients.');
    }

    const data = await response.json();
    return data.patients || []; // Return the list of patients, or an empty array

  } catch (error) {
    console.error("Error searching patients:", error);
    return []; // Return an empty array on error
  }
}