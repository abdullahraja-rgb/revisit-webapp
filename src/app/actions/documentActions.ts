
"use server";

import { python_url } from "@/constants/ApiConstants";


export async function generateSecureModelUrl(blobName: string, authToken: string): Promise<string | null> {
  if (!authToken) {
    console.error("generateSecureModelUrl failed: Auth token not provided.");
    return null;
  }

  
  const encodedBlobName = encodeURIComponent(blobName);
  const url = `${python_url}/generate-sas-url/${encodedBlobName}`;

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
      throw new Error(errorData.detail || 'Failed to generate secure URL.');
    }

    const data = await response.json();
    return data.secure_url;

  } catch (error) {
    console.error("Error generating secure URL:", error);
    return null;
  }
}