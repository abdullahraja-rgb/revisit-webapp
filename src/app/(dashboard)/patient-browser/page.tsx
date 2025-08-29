"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePatientStore } from "@/stores/patientStore";
import { useDashboardModal } from "@/app/(dashboard)/layout";
import {
  CreatePatientForm,
  CreateCarerForm,
  CreateAssessmentForm
} from "@/components/view/(dashboard)/Forms";
import { searchPatients } from "@/app/actions/patientSearchActions";
import { FhirPatient } from "@/types/global";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Plus, Search, UserPlus, ChevronDown, Loader, Inbox, Users, Calendar, Mail, Phone, Activity } from "lucide-react";

// Brand palette
const COLORS = {
  primary: '#005fee',
  secondary: '#3583f7',
  accent: '#6aa6ff',
  text: '#4c4c4c',
  bg: '#fcfcfc',
};

const GradientLine = () => (
  <div
    className="h-[2px] w-28 mx-auto rounded-full animate-pulse"
    style={{
      background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
    }}
  />
);

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
      active 
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}
  >
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {active ? 'Active' : 'Pending'}
  </span>
);

const PatientCard = ({ patient, onViewProfile, onCreateAssessment }: { 
  patient: FhirPatient; 
  onViewProfile: (patient: FhirPatient) => void;
  onCreateAssessment: (patient: FhirPatient) => void;
}) => {
  const patientName = patient.name?.[0];
  const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A';
  const email = patient.telecom?.find(t => t.system === 'email')?.value || 'No email';
  const phone = patient.telecom?.find(t => t.system === 'phone')?.value;
  const givenInitial = patientName?.given?.[0]?.[0] || 'P';
  const familyInitial = patientName?.family?.[0] || 'A';
  const avatar = `${givenInitial}${familyInitial}`;
  
  const age = patient.birthDate ? 
    new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : null;

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 4px 16px rgba(0, 95, 238, 0.06)' }}
      onClick={() => onViewProfile(patient)}
    >
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
            >
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl mb-1 truncate" style={{ color: COLORS.text }}>
                {displayName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="capitalize">{patient.gender || 'N/A'}</span>
                {age && (
                  <>
                    <span>•</span>
                    <span>{age} years old</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <StatusBadge active={patient.active || false} />
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Born {patient.birthDate || 'N/A'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(patient);
            }}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            style={{ color: COLORS.text }}
          >
            View Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateAssessment(patient);
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
          >
            Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PatientBrowserPage() {
  const { patients: recentPatients, isLoading, loadPatients } = usePatientStore();
  const { openModal, closeModal } = useDashboardModal();
  const router = useRouter();
  const { instance, accounts } = useMsal();

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FhirPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  //useEffect(() => {
   // loadPatients();
  //}, [loadPatients]);

  const handleViewProfile = (patient: FhirPatient) => {
    router.push(`/patient-browser/${patient.id}`);
  };

  const handleCreateAssessment = (patient?: FhirPatient) => {
    openModal(<CreateAssessmentForm onClose={closeModal} patient={patient} />, '2xl');
  };

  const handleCreatePatient = () => {
    openModal(<CreatePatientForm onClose={closeModal} />, '2xl');
  };

  const handleCreateCarer = () => {
    openModal(<CreateCarerForm onClose={closeModal} />, '2xl');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
    };

    if (accounts.length === 0) {
        alert("Please log in to perform a search.");
        return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
      });

      const results = await searchPatients(searchQuery, response.accessToken);
      setSearchResults(results);

    } catch (error) {
      console.error("Token acquisition or search failed:", error);
      if (error instanceof Error && error.name === "InteractionRequiredAuthError") {
          instance.acquireTokenPopup(loginRequest);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
    setSearchResults([]);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const patientsToDisplay = hasSearched ? searchResults : recentPatients;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: COLORS.bg }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 left-8 w-64 h-64 opacity-10 rotate-12">
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 80%)',
            }}
          />
        </div>
        <div className="absolute bottom-20 right-10 w-48 h-48 opacity-10 -rotate-12">
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary})`,
              clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 0 100%)',
            }}
          />
        </div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div
                className="p-4 rounded-full shadow-md"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>
              Patient Directory
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Manage your patients, view profiles, and create new assessments with ease.
            </p>
            <div className="mt-4">
              <GradientLine />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                    placeholder="Search patients by name, NHS number, etc..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary } as React.CSSProperties}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    style={{ color: COLORS.text }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Create User
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                      <button
                        onClick={(e) => { e.preventDefault(); handleCreatePatient(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: COLORS.text }}
                      >
                        New Patient
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleCreateCarer(); setDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        style={{ color: COLORS.text }}
                      >
                        New Carer
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCreateAssessment()}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
                >
                  <Plus className="w-4 h-4" />
                  Create Assessment
                </button>
              </div>
            </div>
          </div>

          {hasSearched && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>
                Showing {patientsToDisplay.length} patient{patientsToDisplay.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
              <button
                onClick={clearSearch}
                className="font-medium transition-colors hover:opacity-70"
                style={{ color: COLORS.primary }}
              >
                Clear search
              </button>
            </div>
          )}

          {isLoading || isSearching ? (
            <div className="flex justify-center items-center p-20">
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORS.primary }} />
                <p className="text-gray-500 font-medium">
                  {isSearching ? 'Searching patients…' : 'Loading patients…'}
                </p>
              </div>
            </div>
          ) : patientsToDisplay.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {patientsToDisplay.map((patient, index) => (
                <div 
                  key={patient.id} 
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-in slide-in-from-bottom-2"
                >
                  <PatientCard
                    patient={patient}
                    onViewProfile={handleViewProfile}
                    onCreateAssessment={handleCreateAssessment}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow"
                style={{ backgroundColor: '#f0f7ff' }}
              >
                <Inbox className="w-10 h-10" style={{ color: COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>
                {hasSearched ? 'No patients found' : 'No Patients Found'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {hasSearched
                  ? 'Try adjusting your search criteria.'
                  : 'Create a new patient to get started.'
                }
              </p>
              {!hasSearched && (
                <button
                  onClick={handleCreatePatient}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
                >
                  <Plus className="w-4 h-4" />
                  Create First Patient
                </button>
              )}
            </div>
          )}

          {patientsToDisplay.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <p>Showing 1 to {patientsToDisplay.length} of {patientsToDisplay.length} entries</p>
                <div className="flex items-center space-x-1">
                  <button className="px-2 py-1 border rounded-md hover:bg-gray-100" disabled>&laquo;</button>
                  <button 
                    className="px-3 py-1 border rounded-md text-white font-bold"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    1
                  </button>
                  <button className="px-2 py-1 border rounded-md hover:bg-gray-100" disabled>&raquo;</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}