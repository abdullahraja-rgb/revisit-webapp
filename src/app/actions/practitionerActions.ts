"use server";

import { python_url } from "@/constants/ApiConstants";
import { revalidatePath } from "next/cache";
import { FhirOrganization } from "@/types/global";

type PractitionerFormData = {
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
};


type OrgAdminFormData = {
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
};

export async function createPractitioner(data: PractitionerFormData, authToken: string) {
  const url = `${python_url}/practitioner`;

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
      throw new Error(errorData.detail || 'Failed to create practitioner.');
    }

    revalidatePath("/(dashboard)/patient-browser");

    return { success: true, message: "Practitioner invitation sent successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

export async function getOrganizations(authToken: string): Promise<FhirOrganization[]> {
  if (!authToken) {
    console.error("getOrganizations failed: No auth token provided.");
    return [];
  }

  const url = `${python_url}/organizations`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error("Failed to fetch organizations.");
    const data = await response.json();
    return data.organizations || [];
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}

export async function getPractitionerEmails(authToken: string): Promise<string[]> {
  if (!authToken) {
    console.error("getPractitionerEmails failed: No auth token provided.");
    return [];
  }

  const url = `${python_url}/practitioner-emails`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error("Failed to fetch emails.");
    const data = await response.json();
    return data.emails || [];
  } catch (error) {
    console.error("Error fetching practitioner emails:", error);
    return [];
  }
}

export async function searchPractitioners(
    query: string, 
    organizationId: string, 
    authToken: string
): Promise<FhirPractitioner[]> {
    if (!authToken || !organizationId) {
        console.error("searchPractitioners failed: Auth token or organizationId not provided.");
        return [];
    }

    const url = new URL(`${python_url}/search/practitioners`);
    url.searchParams.append("name", query);
    url.searchParams.append("organization_id", organizationId); 

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to search practitioners.");
        }
        
        const data = await response.json();
        return data.practitioners || [];
    } catch (error) {
        console.error("Error searching practitioners:", error);
        return [];
    }
}


export async function createOrgAdmin(data: OrgAdminFormData, authToken: string) {
  const url = `${python_url}/organization-admin`; 

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
      throw new Error(errorData.detail || 'Failed to create organization admin.');
    }

    // Optionally: refresh relevant pages
    revalidatePath("/(dashboard)/user-management"); 

    return { success: true, message: "Organization Admin invited successfully!" };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}

export async function deletePractitioner(practitionerId: string, authToken: string) {
  if (!authToken) {
    return { success: false, message: "Authentication error." };
  }

  const url = `${python_url}/practitioner/${practitionerId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete practitioner.');
    }
    
    revalidatePath("/admin");
    revalidatePath("/org-admin");
    return { success: true, message: "Practitioner deactivated successfully!" };

  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "An unknown error occurred." };
  }
}