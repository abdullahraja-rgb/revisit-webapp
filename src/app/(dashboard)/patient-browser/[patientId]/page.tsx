"use client";

import React from "react";
import { usePatient } from "@/contexts/PatientContext";
import { User, Cake, Phone, Home as HomeIcon, Hash, MapPin, HeartPulse } from "lucide-react";

// A restyled, more visually engaging DetailItem component
const DetailItem = ({ 
    icon, 
    label, 
    value 
}: { 
    icon: React.ReactNode; 
    label: string; 
    value: string | number | undefined | null 
}) => (
  <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-blue-500/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-blue-900/60">{label}</p>
        <p className="font-bold text-lg text-gray-800">{value || "N/A"}</p>
      </div>
    </div>
  </div>
);

export default function PatientOverviewPage() {
  const patient = usePatient();

  // Data extraction from the patient context
  const patientName = patient.name?.[0];
  const address = patient.address?.[0];
  const phone = patient.telecom?.find(t => t.system === "phone")?.value;
  const nhsNumber = patient.identifier?.find(id => id.system?.includes("nhs-number"))?.value;
  const mrn = patient.identifier?.find(id => id.type?.text === "Medical Record Number")?.value;

  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(patient.birthDate);

  return (
    <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/3 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-200/5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
      
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#005fee] via-[#3583f7] to-[#6aa6ff]"></div>

      <div className="relative p-8 md:p-10">
        {/* Header Section */}
        <header className="flex items-center gap-6 sm:gap-8 mb-8">
            <div className="relative flex-shrink-0">
                <div className="absolute -inset-2 bg-blue-500/10 rounded-3xl transform rotate-3"></div>
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500 shadow-2xl transform -rotate-3">
                    <User className="h-10 w-10 text-white" />
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-[#4c4c4c] mb-1">
                    Patient Overview
                </h1>
                <p className="text-lg text-gray-500 font-medium">
                    Key demographic and contact information.
                </p>
            </div>
        </header>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailItem
            icon={<User size={24} className="text-blue-500" />}
            label="Full Name"
            value={patientName ? `${patientName.given.join(" ")} ${patientName.family}` : "N/A"}
          />
          <DetailItem
            icon={<Cake size={24} className="text-blue-500" />}
            label="Date of Birth"
            value={patient.birthDate}
          />
          <DetailItem
            icon={<HeartPulse size={24} className="text-blue-500" />}
            label="Age"
            value={age !== null ? `${age} years` : undefined}
          />
          <DetailItem 
            icon={<Hash size={24} className="text-blue-500" />} 
            label="NHS Number" 
            value={nhsNumber} 
          />
          <DetailItem 
            icon={<Hash size={24} className="text-blue-500" />} 
            label="Medical Record Number" 
            value={mrn} 
          />
          <DetailItem 
            icon={<Phone size={24} className="text-blue-500" />} 
            label="Phone" 
            value={phone} 
          />
          <DetailItem
            icon={<MapPin size={24} className="text-blue-500" />}
            label="Address"
            value={address ? `${address.line?.join(", ")}, ${address.city}, ${address.postalCode}` : "N/A"}
          />
        </div>
      </div>
    </div>
  );
}