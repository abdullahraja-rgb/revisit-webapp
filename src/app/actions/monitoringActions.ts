"use server";

import { python_url } from "@/constants/ApiConstants";

/**
 * Fetches the FHIR Bundle containing all ServiceRequests (assessments)
 * and their related Task resources for the logged-in practitioner's tenant.
 * @param authToken - The user's valid access token.
 */
export async function getAssessments(authToken: string) {
  const url = `${python_url}/assessments`;

  if (!authToken) {
    console.error("getAssessments failed: Auth token was not provided.");
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Send the real token to the backend
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch assessments.');
    }

    return await response.json();

  } catch (error) {
    console.error("Error fetching assessments:", error);
    return null;
  }
}