"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";


export async function getAssessments(authToken: string) {
  const url = `${python_url}/assessments`;

  if (!authToken) {
    console.error("getAssessments failed: Auth token was not provided.");
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        
        'Authorization': `Bearer ${authToken}`
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch assessments.');
    }

    return await response.json();

  } catch (error) {
    console.error("Error fetching assessments:", error);
    return null;
  }
}
export async function setObservationViewedStatus(observationId: string, viewed: boolean, authToken: string) {
  const url = `${python_url}/observation/${observationId}/status`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({ viewed }),
    });
    if (!response.ok) throw new Error("Failed to update observation status.");
    revalidatePath("/remote-monitoring"); // Refresh the page data
    return { success: true };
  } catch (error) {
    console.error("Error setting observation status:", error);
    return { success: false, message: (error as Error).message };
  }
}


export async function completeAssessment(assessmentId: string, authToken: string) {
  const url = `${python_url}/assessment/${assessmentId}/complete`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!response.ok) throw new Error("Failed to complete assessment.");
    revalidatePath("/remote-monitoring");
    return { success: true };
  } catch (error) {
    console.error("Error completing assessment:", error);
    return { success: false, message: (error as Error).message };
  }
}