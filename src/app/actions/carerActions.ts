// src/app/actions/carerActions.ts
"use server";
    
import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";

// Define the shape of the data coming from the carer form
type CarerFormData = {
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  patientId: string; 
  patientName: string; // Added patient's name for the 'display' field
  relationship: string;
  relationshipDisplay: string; // Added relationship display text
};

/**
 * Receives carer data from the form and posts it to the Python backend.
 */
export async function createCarer(data: CarerFormData) {
  const url = `${python_url}/carer`; 

  console.log("Sending carer data to backend:", JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create carer.');
    }
    
    revalidatePath("/(dashboard)"); 
    return { success: true, message: "Carer created successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}