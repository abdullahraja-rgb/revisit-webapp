"use client";

import { createContext, useContext } from "react";
import { FhirPatient } from "@/types/global";

export const PatientContext = createContext<FhirPatient | null>(null);

export const usePatient = (): FhirPatient => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatient must be used within a PatientContext.Provider");
  }
  return context;
};
