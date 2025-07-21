"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/utils/getAccessToken"; // We'll create this utility next

// Define the shape of the data coming from the practitioner form
type PractitionerFormData = {
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
};

/**
 * Receives practitioner data from the admin form and posts it to the Python backend.
 * The backend will then use the Graph API to create and invite the user.
 */
export async function createPractitioner(data: PractitionerFormData) {
  const url = `${python_url}/practitioner`; 

  // In a real application, we need to get the admin's token to authorize this action
  const authToken = await getAccessToken();
  if (!authToken) {
    return { success: false, message: "Authentication error: Could not get access token." };
  }

  console.log("Sending new practitioner data to backend:", JSON.stringify(data, null, 2));

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
      throw new Error(errorData.detail || 'Failed to create practitioner.');
    }
    
    // Revalidate the patient browser in case the new practitioner adds patients
    revalidatePath("/(dashboard)/patient-browser"); 

    return { success: true, message: "Practitioner invitation sent successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}
