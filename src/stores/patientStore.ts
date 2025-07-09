import { create } from "zustand";
import { Patient, Model } from "../../types/global";
import {
  getPatientsData,
  ModelFile,
  PatientsApiResponse,
  PatientSession,
} from "../app/(dashboard)/action";

// Dummy patient names for demo purposes
const dummyPatientNames = [
  "John Smith",
  "Sarah Johnson",
  "Michael Chen",
  "Emily Davis",
  "David Wilson",
  "Jessica Brown",
  "Robert Garcia",
  "Amanda Taylor",
  "Christopher Lee",
  "Samantha Martinez",
  "Daniel Rodriguez",
  "Ashley Thompson",
  "Matthew White",
  "Lauren Anderson",
  "Andrew Jackson",
  "Nicole Harris",
  "Kevin Clark",
  "Rachel Lewis",
  "Ryan Walker",
  "Michelle Hall",
];

// Dummy conditions for demo purposes
const dummyConditions = [
  "Post-surgical recovery",
  "Physical therapy",
  "Mobility assessment",
  "Home safety evaluation",
  "Rehabilitation therapy",
  "Occupational therapy",
  "Balance training",
  "Strength assessment",
];

// Transform API response to Patient objects
function transformApiDataToPatients(apiData: PatientsApiResponse): Patient[] {
  if (!apiData?.files || !Array.isArray(apiData.files)) {
    return [];
  }

  return apiData.files
    .filter((session: PatientSession) => session.files?.models?.length > 0) // Only include sessions with models
    .sort((a: PatientSession, b: PatientSession) => {
      // Sort by upload_date - most recent first
      return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
    })
    .map((session: PatientSession, index: number) => {
      const patientName = dummyPatientNames[index % dummyPatientNames.length];
      const condition = dummyConditions[index % dummyConditions.length];
      const age = Math.floor(Math.random() * 50) + 25; // Random age between 25-75

      // Include all models that have glb_uri (don't filter by filename since all are .usdz but have GLB versions)
      const validModels = session.files.models.filter(
        (modelData: ModelFile) => modelData.glb_uri && modelData.glb_uri.trim() !== ""
      );

      const models: Model[] = validModels.map((modelData: ModelFile, modelIndex: number) => ({
        id: `${session.session_id}-model-${modelIndex}`,
        name: `3D Capture ${modelIndex + 1}`,
        modelType: "glb",
        modelUrl: modelData.glb_uri,
        room: "Home Environment",
        captureDate: new Date(session.upload_date).toISOString().split("T")[0],
        thumbnailUrl: "/assets/images/placeholder-thumb.jpg",
        measurements: [],
      }));

      return {
        id: session.session_id,
        name: patientName,
        age,
        condition,
        lastAssessment: new Date(session.upload_date).toISOString().split("T")[0],
        models,
      };
    })
    .filter((patient: Patient) => patient.models.length > 0); // Only include patients with valid GLB models
}

// Fallback static data in case API fails
const fallbackPatients: Patient[] = [
  {
    id: "fallback-patient-1",
    name: "Demo Patient",
    age: 45,
    condition: "Demo condition",
    lastAssessment: "2025-07-04",
    models: [
      {
        id: "fallback-model-1",
        name: "Demo Model",
        modelType: "glb",
        modelUrl: "/assets/models/glb/octa.glb",
        room: "Demo Room",
        captureDate: "2025-07-04",
        thumbnailUrl: "/assets/images/placeholder-thumb.jpg",
        measurements: [],
      },
    ],
  },
];

export interface PatientStore {
  // Data (from API)
  patients: Patient[];
  isLoading: boolean;
  error: string | null;

  // UI State only - no persistence needed
  selectedPatient: Patient | null;
  showCloudIntegration: boolean;
  isUploadModelOpen: boolean;
  isReportGeneratorOpen: boolean;
  sidebarCollapsed: boolean;

  // Data actions (API calls)
  loadPatients: () => Promise<void>;
  getPatients: () => Patient[];
  getPatientById: (id: string) => Patient | null;
  getModelById: (patientId: string, modelId: string) => Model | null;

  // UI actions
  setSelectedPatient: (patient: Patient | null) => void;
  toggleCloudIntegration: () => void;
  toggleUploadModal: () => void;
  toggleReportGenerator: () => void;
  toggleSidebar: () => void;

  // Model management (simulating API)
  addModel: (patientId: string, model: Omit<Model, "id">) => void;
  removeModel: (patientId: string, modelId: string) => void;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  // Initial state
  patients: [],
  isLoading: false,
  error: null,
  selectedPatient: null,
  showCloudIntegration: false,
  isUploadModelOpen: false,
  isReportGeneratorOpen: false,
  sidebarCollapsed: false,

  // Data API calls
  loadPatients: async () => {
    set({ isLoading: true, error: null });

    try {
      const apiData = await getPatientsData();

      if (apiData && "success" in apiData && !apiData.success) {
        throw new Error(apiData.message || "Failed to fetch patients data");
      }

      const transformedPatients = transformApiDataToPatients(apiData as PatientsApiResponse);

      // Use fallback data if no valid patients found
      const patients = transformedPatients.length > 0 ? transformedPatients : fallbackPatients;

      set({
        patients,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading patients:", error);
      set({
        patients: fallbackPatients,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load patients data",
      });
    }
  },

  getPatients: () => {
    return get().patients;
  },

  getPatientById: (id: string) => {
    const patients = get().patients;
    return patients.find((p) => p.id === id) || null;
  },

  getModelById: (patientId: string, modelId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient) return null;
    return patient.models.find((m) => m.id === modelId) || null;
  },

  // UI State actions
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  toggleCloudIntegration: () =>
    set((state) => ({ showCloudIntegration: !state.showCloudIntegration })),

  toggleUploadModal: () => set((state) => ({ isUploadModelOpen: !state.isUploadModelOpen })),

  toggleReportGenerator: () =>
    set((state) => ({ isReportGeneratorOpen: !state.isReportGeneratorOpen })),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Model management (simulating API calls)
  addModel: (patientId: string, modelData: Omit<Model, "id">) => {
    const newModel: Model = {
      ...modelData,
      id: `model-${Date.now()}`, // Simple ID generation
    };

    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === patientId ? { ...patient, models: [...patient.models, newModel] } : patient
      ),
    }));
  },

  removeModel: (patientId: string, modelId: string) => {
    set((state) => ({
      patients: state.patients.map((patient) =>
        patient.id === patientId
          ? { ...patient, models: patient.models.filter((m) => m.id !== modelId) }
          : patient
      ),
    }));
  },
}));
