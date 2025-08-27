"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/utils/getAccessToken";
import { FhirOrganization } from "@/types/global";


export interface OrganizationNode extends FhirOrganization {
  children: OrganizationNode[];
}

export type OrganizationFormData = {
  name: string;
  id: string;
  odsCode: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  partOf: string | null;
};


export async function createOrganization(data: OrganizationFormData, authToken: string) {
  const url = `${python_url}/organization`; 

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
      throw new Error(errorData.detail || 'Failed to create organization.');
    }

    revalidatePath("/admin"); 
    return { success: true, message: "Organization created successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}


export async function getOrganizationTree(authToken: string): Promise<{
  tree: OrganizationNode[];
  existingIds: string[];
  existingNames: string[];
}> {
  if (!authToken) { 
    console.error("getOrganizationTree failed: No auth token provided.");
    return { tree: [], existingIds: [], existingNames: [] };
  }

  const url = `${python_url}/organizations-tree`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch organization tree. Status: ${response.status}`);
    }

    const responseData = await response.json();


    return {
      tree: responseData.tree || [],
      existingIds: responseData.all_ids || [],
      existingNames: responseData.all_names || [],
    };

  } catch (error) {
    console.error("Error fetching organization tree:", error);
    return { tree: [], existingIds: [], existingNames: [] };
  }
}