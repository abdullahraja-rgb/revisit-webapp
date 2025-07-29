"use server";

import { python_url } from "@/constants/ApiConstants";

/**
 * Calls the backend to generate a secure, short-lived SAS URL for a private blob.
 * @param blobName - The full path of the blob in the storage container.
 * @param authToken - The user's valid access token.
 * @returns The full, secure URL with the SAS token, or null on error.
 */
export async function generateSecureModelUrl(blobName: string, authToken: string): Promise<string | null> {
  const url = `${python_url}/generate-sas-url/${blobName}`;

  if (!authToken) {
    console.error("generateSecureModelUrl failed: Auth token not provided.");
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Send the real token to the backend, just like in getAssessments
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to generate secure URL.');
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error) {
    console.error("Error generating secure URL:", error);
    return null;
  }
}