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

/**
 * Receives carer data from the form and posts it to the Python backend.
 * @param data - The form data.
 * @param authToken - The user's valid access token.
 */
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