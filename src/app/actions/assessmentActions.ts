"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";

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
    blockTitle: string;
  }[];
};

/**
 * Receives assessment data from the form and posts it to the Python backend.
 * @param data - The form data.
 * @param authToken - The user's valid access token.
 */
export async function createAssessmentAndTasks(data: AssessmentData, authToken: string) {
  const url = `${python_url}/create-assessment`;
  
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
      throw new Error(errorData.detail || 'Failed to create assessment.');
    }
    
    revalidatePath("/remote-monitoring");
    return { success: true, message: "Assessment created successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

export async function getAssessmentsForPatient(patientId: string, authToken: string): Promise<FhirServiceRequest[]> {
  if (!authToken) {
    console.error("getAssessmentsForPatient failed: User is not authenticated.");
    return [];
  }

  const url = `${python_url}/assessments/patient/${patientId}`;

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
      throw new Error(errorData.detail || 'Failed to fetch patient assessments.');
    }

    const data = await response.json();
    return data.assessments || [];

  } catch (error) {
    console.error("Error fetching patient assessments:", error);
    return [];
  }
}