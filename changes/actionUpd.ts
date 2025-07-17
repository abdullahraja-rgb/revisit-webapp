"use server";

import { python_url } from "@/constants/ApiConstants";

// --- FHIR-COMPLIANT INTERFACES ---

export interface FhirSecurity {
  system: string;
  code: string;
}

export interface FhirMeta {
  versionId: string;
  lastUpdated: string;
  security: FhirSecurity[];
}

export interface FhirIdentifier {
  use: string;
  system: string;
  value: string;
  type?: { // Added optional type property
    text: string;
  };
}

export interface FhirName {
  use: string;
  family: string;
  given: string[];
}

export interface FhirTelecom {
  system: string;
  value: string;
  use: string;
}

export interface FhirAddress {
  use: string;
  line: string[];
  city: string;
  postalCode: string;
  country: string;
}

export interface FhirManagingOrganization {
  reference: string;
}

export interface FhirPatient {
  resourceType: "Patient";
  id: string;
  meta: FhirMeta; // Added meta
  identifier: FhirIdentifier[];
  active: boolean;
  name: FhirName[];
  telecom: FhirTelecom[]; // Added telecom
  gender: string;
  birthDate: string;
  address: FhirAddress[]; // Added address
  managingOrganization: FhirManagingOrganization; // Added managingOrganization
}

export interface PatientsApiResponse {
  patients: FhirPatient[];
}

/**
 * Fetches the list of patients for the currently logged-in practitioner.
 * This function calls the new, secure `/patients` endpoint on the backend.
 *
 * @param {string} authToken - The JWT token for the authenticated practitioner.
 * @returns {Promise<PatientsApiResponse | { success: false; message: string }>}
 */
export async function getPractitionerPatients(
  authToken: string
): Promise<PatientsApiResponse | { success: false; message: string }> {
  
  // The new endpoint URL
  const url = `${python_url}/patients`;

  // Check if the auth token is provided
  if (!authToken) {
    console.error("Authentication token is missing.");
    return {
      success: false,
      message: "Authentication token is required.",
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        // The user's token is sent to the backend for authentication and authorization
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to fetch patients. Status: ${response.status}`);
    }

    const data = (await response.json()) as PatientsApiResponse;

    // Validate the response structure
    if (!data || !Array.isArray(data.patients)) {
      throw new Error("Invalid response format: expected a 'patients' array");
    }

    return data;
  } catch (error) {
    console.error("Error fetching practitioner's patients:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}





import { revalidatePath } from "next/cache";

// This is a placeholder type. You would define this more robustly.
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
  }[];
};

/**
 * Receives assessment data from the form and posts it to the Python backend.
 * This function runs securely on the server.
 */
export async function createAssessmentAndTasks(data: AssessmentData) {
  const url = `${python_url}/create-assessment`;
  
  console.log("Sending data to backend:", JSON.stringify(data, null, 2));

  try {
    // In the future, you will uncomment this to make the real API call.
    /*
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You would get the real auth token here
        // 'Authorization': `Bearer <your_auth_token>` 
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create assessment.');
    }
    
    const result = await response.json();
    console.log("Backend response:", result);
    */

    // Revalidate the dashboard path to show any new data
    revalidatePath("/(dashboard)");

    // For now, we'll just simulate success.
    return { success: true, message: "Assessment created successfully!" };

  } catch (error) {
    console.error("Error creating assessment:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}