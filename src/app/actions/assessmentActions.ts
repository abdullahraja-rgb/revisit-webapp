"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";

type AssessmentData = {
  patient: string;
  assessmentType: string;
  performerType: string;
  performerName: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  performerId?: string | null;
};

export async function createAssessmentAndTasks(data: AssessmentData, authToken: string) {
  console.log('🔍 Data received:', data);
  
  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }

  const url = `${python_url}/create-assessment`;

  try {
    console.log('🔍 Sending payload:', JSON.stringify(data, null, 2));
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(data),
    });

    console.log('🔍 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('🔍 Error response:', errorData);
      throw new Error(errorData.detail || "Failed to create assessment.");
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


export async function getAssessmentsForPatient(patientId: string, authToken: string): Promise<any> {
  if (!authToken) {
    console.error("getAssessmentsForPatient failed: User is not authenticated.");
    return null;
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

    // Return the entire JSON bundle from the response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error fetching patient assessments:", error);
    return null;
  }
}