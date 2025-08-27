"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";


type CarerFormData = {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  patientId: string;
  patientName: string;
  relationship: string;
  relationshipDisplay: string;
};


export type CarerData = {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; 
  displayName?: string; 
  gender: string;
  phone: string;
  relationship: string;
  relationshipDisplay: string;
};


export async function createCarer(data: CarerFormData, authToken: string) {
  const url = `${python_url}/carer`;

  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create carer.');
    }

    revalidatePath("/patient-browser");

    return { success: true, message: "Carer created successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}


export async function fetchCarersForPatient(patientId: string, authToken: string): Promise<{ success: boolean; data?: CarerData[]; message?: string }> {

  const url = `${python_url}/patient/${patientId}/carers`;

  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }
  if (!patientId) {
    return { success: false, message: "Patient ID is required." };
  }

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
      throw new Error(errorData.detail || 'Failed to fetch carers.');
    }

    const carers: CarerData[] = await response.json();
    
    const carersWithDisplayName = carers.map(carer => ({
      ...carer,
      name: `${carer.firstName} ${carer.lastName}`,
      displayName: `${carer.firstName} ${carer.lastName}`
    }));

    return { success: true, data: carersWithDisplayName };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred while fetching carers." };
  }
}



export async function searchCarersForPatient(patientId: string, name: string, authToken: string): Promise<{ success: boolean; data?: CarerData[]; message?: string }> {
  // If the search term is empty, return an empty array immediately.
  if (!name.trim()) {
    return { success: true, data: [] };
  }
  
  // This points to the new search endpoint you just created in the backend.
  const url = new URL(`${python_url}/patient/${patientId}/carers/search`);
  url.searchParams.append('name', name);

  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }

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
      throw new Error(errorData.detail || 'Failed to search for carers.');
    }

    const carers: CarerData[] = await response.json();
    
    // Also add the computed display name to the search results.
    const carersWithDisplayName = carers.map(carer => ({
      ...carer,
      name: `${carer.firstName} ${carer.lastName}`,
      displayName: `${carer.firstName} ${carer.lastName}`
    }));

    return { success: true, data: carersWithDisplayName };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred while searching for carers." };
  }
}