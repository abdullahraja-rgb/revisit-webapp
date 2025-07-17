// src/app/actions/patientActions.ts
"use server";
    
import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";

// Define the shape of the data coming from our form
type PatientFormData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  nhsNumber: string;
  mrn: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
};

export async function createPatient(data: PatientFormData) {
  const url = `${python_url}/patient`; // The backend endpoint for creating a patient

  console.log("Sending patient data to backend:", JSON.stringify(data, null, 2));

  try {
    // --- THIS IS THE NEWLY ADDED FETCH REQUEST ---
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real app with auth, you would add your Authorization header here
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle errors from the backend
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create patient.');
    }
    
    revalidatePath("/(dashboard)"); 
    return { success: true, message: "Patient created successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}