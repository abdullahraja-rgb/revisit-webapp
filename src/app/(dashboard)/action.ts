"use server";

import { python_url } from "@/constants/ApiConstants";

export interface ModelFile {
  filename: string;
  usdz_uri: string;
  glb_uri: string;
  usdz_s3_key: string;
  glb_s3_key: string;
}

export interface ImageFile {
  filename: string;
  uri: string;
  s3_key: string;
}

export interface SessionFiles {
  models: ModelFile[];
  images: ImageFile[];
  videos: unknown[];
}

export interface PatientSession {
  session_id: string;
  upload_date: string;
  description: string;
  files: SessionFiles;
  file_count: number;
}

export interface PatientsApiResponse {
  files: PatientSession[];
}

export async function getPatientsData(): Promise<
  PatientsApiResponse | { success: false; message: string }
> {
  const url = `${python_url}/files`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files. Status: ${response.status}`);
    }

    const data = (await response.json()) as PatientsApiResponse;

    // Validate the response structure
    if (!data || !Array.isArray(data.files)) {
      throw new Error("Invalid response format: expected files array");
    }

    return data;
  } catch (error) {
    console.error("Error fetching patients data:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch patients data",
    };
  }
}
