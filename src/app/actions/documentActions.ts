"use server";

import { python_url } from "@/constants/ApiConstants";

/**
 * Calls the backend to generate a secure, short-lived SAS URL for a private blob.
 * @param blobName - The full path of the blob in the storage container (e.g., 'tenant-id/manual_uploads/file.glb').
 * @returns The full, secure URL with the SAS token, or null on error.
 */
export async function generateSecureModelUrl(blobName: string): Promise<string | null> {
  const url = `${python_url}/generate-sas-url/${blobName}`;
  const authToken = "fake-practitioner-token-leeds"; // For testing

  console.log(`Requesting SAS URL for blob: ${blobName}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
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

