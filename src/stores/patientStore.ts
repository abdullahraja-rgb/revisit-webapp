import { create } from "zustand";
import { FhirPatient } from "../../types/global"; // Ensure this path is correct

// Define the shape of a 3D Model (for frontend use)
interface Model {
  id: string;
  name: string;
  modelUrl: string;
  room: string;
  captureDate: string;
  modelType: string;
  thumbnailUrl: string;
  measurements: any[]; // Using 'any' for now for simplicity
}

// This interface combines the FHIR patient with the frontend-specific models array
export interface Patient extends FhirPatient {
  models: Model[];
}

// Fallback static data in case the API fails or for development
const fallbackPatients: Patient[] = [
  {
    resourceType: "Patient",
    id: "537a1e34-ce9f-4e3f-a4c2-2cdfedf78542", // Use a real ID from your tests
    name: [{ use: "official", family: "Raja", given: ["Abdullah"] }],
    active: true,
    gender: "male",
    birthDate: "1980-01-01",
    telecom: [{ system: 'email', value: 'abdullah.r@email.com' }],
    identifier: [{ system: 'https://fhir.nhs.uk/Id/nhs-number', value: '1112223333' }],
    // Add other required FHIR properties as placeholders
    address: [],
    meta: { versionId: '1', lastUpdated: '', security: [] },
    managingOrganization: { reference: '' },
    models: [], // Models are loaded dynamically via observations now
  },
];

export interface PatientStore {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  selectedPatient: Patient | null;
  // UI State from your original store
  showCloudIntegration: boolean;
  isUploadModelOpen: boolean;
  isReportGeneratorOpen: boolean;
  sidebarCollapsed: boolean;

  // Actions
  loadPatients: () => void; // Simplified action
  getPatientById: (id: string) => Patient | null;
  getModelById: (patientId: string, modelId: string) => Model | null;
  setSelectedPatient: (patient: Patient | null) => void;
  toggleCloudIntegration: () => void;
  toggleUploadModal: () => void;
  toggleReportGenerator: () => void;
  toggleSidebar: () => void;
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

  // --- UPDATED loadPatients function ---
  // This now loads mock data directly to fix the 404 error
  // and prevent the infinite loading screen.
  loadPatients: () => {
    set({ isLoading: true, error: null });
    console.log("Loading initial patient data from fallback store...");
    
    // Simulate a network delay
    setTimeout(() => {
        set({
            patients: fallbackPatients,
            isLoading: false,
            // Set the first patient as selected by default
            selectedPatient: fallbackPatients[0] || null, 
        });
    }, 500);
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
  toggleCloudIntegration: () => set((state) => ({ showCloudIntegration: !state.showCloudIntegration })),
  toggleUploadModal: () => set((state) => ({ isUploadModelOpen: !state.isUploadModelOpen })),
  toggleReportGenerator: () => set((state) => ({ isReportGeneratorOpen: !state.isReportGeneratorOpen })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));