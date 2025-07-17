"use server";

import { python_url } from "@/constants/ApiConstants";

/**
 * Fetches the FHIR Bundle containing Observations and linked DocumentReferences for a patient.
 */
export async function getObservationsForPatient(patientId: string) {
  const url = `${python_url}/observations/${patientId}`;
  const authToken = "fake-practitioner-token-leeds"; // For testing

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch observations.');
    }

    return await response.json(); // Return the full FHIR Bundle

  } catch (error) {
    console.error("Error fetching observations:", error);
    return null; // Return null on error
  }
}