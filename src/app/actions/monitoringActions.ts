"use server";

import { python_url } from "@/constants/ApiConstants";

/**
 * Fetches the FHIR Bundle containing all ServiceRequests (assessments)
 * and their related Task resources for the logged-in practitioner's tenant.
 */
export async function getAssessments() {
  const url = `${python_url}/assessments`;
  // In a real app, the token would be retrieved from the user's session
  const authToken = "fake-practitioner-token-leeds";

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      // Use cache: 'no-store' to ensure you always get the latest data
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch assessments.');
    }

    return await response.json(); // Return the full FHIR Bundle

  } catch (error) {
    console.error("Error fetching assessments:", error);
    return null; // Return null on error
  }
}