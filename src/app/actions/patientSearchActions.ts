"use server";

import { python_url } from "@/constants/ApiConstants";
import { FhirPatient } from "@/types/global";


export async function searchPatients(query: string, authToken: string): Promise<FhirPatient[]> {
  const url = new URL(`${python_url}/search/patients`);
  url.searchParams.append("q", query);

  if (!authToken) {
    console.error("Search failed: Auth token was not provided.");
    return [];
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Failed to search patients.');
      } catch (e) {
        throw new Error(errorText || 'Failed to search patients.');
      }
    }

    const data = await response.json();
    return data.patients || [];

  } catch (error) {
    console.error("Error searching patients:", error);
    return [];
  }
}