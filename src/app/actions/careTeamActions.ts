"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/utils/getAccessToken";
import { FhirCareTeam } from "@/types/global";


type CareTeamFormData = {
  name: string;
  memberIds: string[];
  organizationId: string;
};

export async function createCareTeam(data: CareTeamFormData, authToken?: string) {
  const token = authToken || (await getAccessToken());
  if (!token) {
    return { success: false, message: "Authentication error." };
  }

  const url = `${python_url}/care-team`;

  try {

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create care team.");
    }

    revalidatePath("/admin");
    return { success: true, message: "Care team created successfully!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

export async function getCareGroups(authToken?: string): Promise<FhirCareTeam[]> {
  const token = authToken || (await getAccessToken());
  if (!token) {
    console.warn("Missing access token for fetching care groups.");
    return [];
  }

  const url = `${python_url}/care-groups`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to fetch care groups:", errorData.detail || response.statusText);
      return [];
    }

    const data = await response.json();
    // Backend now returns enriched data, so just pass it through
    return Array.isArray(data.care_teams) ? data.care_teams : [];
  } catch (error) {
    console.error("Error fetching care groups:", error);
    return [];
  }
}

export async function updateCareTeamMembers(
  teamId: string, 
  memberIds: string[], 
  authToken: string // Make authToken required
) {
  if (!authToken) {
    return { success: false, message: "Authentication error: Auth token not provided." };
  }

  const url = `${python_url}/care-team/${teamId}/members`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ memberIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update care team members.");
    }

    revalidatePath("/admin");
    return { success: true, message: "Care team members updated successfully!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}

import { FhirPractitioner } from "@/types/global";


export async function searchPractitionersInCareTeam(
  careTeamId: string,
  name: string,
  authToken: string,
  targetOrgId?: string
): Promise<FhirPractitioner[]> {
  if (!authToken) {
    console.error("Search failed: Auth token not provided.");
    return [];
  }


  let url = `${python_url}/manage-care-team/search?care_team_id=${encodeURIComponent(
    careTeamId
  )}&name=${encodeURIComponent(name)}`;
  

  if (targetOrgId) {
    url += `&target_org_id=${encodeURIComponent(targetOrgId)}`;
  }

  console.log("Frontend: Making request to:", url); // Debug log

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        const errorData = await response.text();
        console.error(
          `Failed to search practitioners: ${response.status} ${errorData}`
        );
      }
      return [];
    }

    const data = await response.json();
    console.log("Frontend: Received response:", data); // Debug log


    if (data && data.practitioners && Array.isArray(data.practitioners)) {
      console.log("Frontend: Returning practitioners:", data.practitioners);
      return data.practitioners;
    } else if (Array.isArray(data)) {

      console.log("Frontend: Returning direct array:", data);
      return data;
    } else {
      console.error("Frontend: Unexpected response format:", data);
      return [];
    }
  } catch (error: any) {
    console.error("Error during practitioner search fetch:", error);
    return [];
  }
}


export async function deleteCareTeam(teamId: string, authToken: string) {
  if (!authToken) {
    return { success: false, message: "Authentication error." };
  }
  if (!teamId) {
    return { success: false, message: "Care Team ID is missing." };
  }

  const url = `${python_url}/care-team/${teamId}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete care team.");
    }

    revalidatePath("/admin"); // This helps refresh data if needed elsewhere
    return { success: true, message: "Care team deleted successfully!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
}