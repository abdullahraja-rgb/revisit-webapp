"use server";

import { python_url } from "@/constants/ApiConstants";


export async function getObservationsForPatient(patientId: string, authToken: string) {
  if (!authToken) {
    console.error("getObservationsForPatient failed: Auth token not provided.");
    return null;
  }

  const url = `${python_url}/observations/${patientId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch observations.');
    }

    return await response.json(); // Return the full FHIR Bundle

  } catch (error) {
    console.error("Error fetching observations:", error);
    return null;
  }
}