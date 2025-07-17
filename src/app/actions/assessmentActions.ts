"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";

// Define the shape of the data coming from our form
type AssessmentData = {
  serviceRequest: {
    patient: string;
    assessmentType: string;
    performerType: string;
    performerName: string;
    startDate: string;
    endDate: string;
  };
  tasks: {
    description: string;
    type: string;
    notes: string;
    blockTitle: string; // Added from the form logic
  }[];
};

/**
 * Receives assessment data from the form and posts it to the Python backend.
 * This function runs securely on the server.
 */
export async function createAssessmentAndTasks(data: AssessmentData) {
  const url = `${python_url}/create-assessment`;
  
  // For testing, we'll use the hardcoded token that the backend recognizes.
  // In a real application, you would get this token from the user's session.
  const authToken = "fake-practitioner-token-leeds";

  console.log("Sending data to backend:", JSON.stringify(data, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // This header is the new, required change for authentication
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create assessment.');
    }
    
    // This function tells Next.js to refresh the data on the dashboard page
    // so that any new assessments or tasks might appear.
    revalidatePath("/(dashboard)");

    return { success: true, message: "Assessment created successfully!" };

  } catch (error) {
    console.error("Error creating assessment:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}
