"use server";

// The python_url is now directly accessed from process.env
// This is a more robust way to handle environment variables in server actions.
const python_url = process.env.PYTHON_URI;

/**
 * Fetches the FHIR Bundle containing all ServiceRequests (assessments)
 * and their related Task resources for the logged-in practitioner's tenant.
 */
export async function getAssessments() {
  // --- THIS IS THE FIX ---
  // We add a check to ensure the backend URL is configured.
  if (!python_url) {
    throw new Error("Backend URL is not configured. Please check your .env.local file.");
  }

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