import React from "react";
import { FhirPatient } from "@/types/global";
import { Phone, Home, User, Mail } from "lucide-react";

// Define the component's props to accept the patient object and the two handler functions
type PatientCardProps = {
  patient: FhirPatient;
  onViewProfile: (patient: FhirPatient) => void;
  onCreateAssessment: (patient: FhirPatient) => void;
};

const PatientCard = ({ patient, onViewProfile, onCreateAssessment }: PatientCardProps) => {
  const patientName = patient.name?.[0];
  const address = patient.address?.[0];
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
      {/* Patient Info */}
      <div className="flex items-center col-span-1 lg:col-span-2">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
          {patientName?.given[0]?.[0] || 'P'}
          {patientName?.family?.[0] || 'A'}
        </div>
        <div className="ml-4">
          <p className="text-lg font-semibold text-gray-900">
            {patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A'}
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${patient.active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {patient.active ? 'active' : 'pending'}
            </span>
          </p>
          <p className="text-sm text-gray-500">DOB: {patient.birthDate || 'N/A'}</p>
        </div>
      </div>

      {/* Contact & Details */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span>NHS: {patient.identifier?.find(id => id.system.includes('nhs-number'))?.value || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-2 text-gray-400" />
          <span>{patient.telecom?.find(t => t.system === 'phone')?.value || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Home className="w-4 h-4 mr-2 text-gray-400" />
          <span>{address ? `${address.line[0]}, ${address.city}` : 'N/A'}</span>
        </div>
         <div className="flex items-center">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          <span>{patient.telecom?.find(t => t.system === 'email')?.value || 'N/A'}</span>
        </div>
      </div>

      {/* Action Buttons with onClick handlers */}
      <div className="col-span-1 flex justify-start md:justify-end items-center space-x-2">
        <button onClick={() => onViewProfile(patient)} className="btn-secondary">
          View Profile
        </button>
        <button onClick={() => onCreateAssessment(patient)} className="btn-primary">
          Create Assessment
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
