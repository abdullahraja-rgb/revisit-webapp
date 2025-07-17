"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePatientStore } from "@/stores/patientStore";
import { useDashboardModal } from "@/app/(dashboard)/layout"; // Import the global modal hook
import {
  CreatePatientForm,
  CreateCarerForm,
  CreateAssessmentForm
} from "@/components/view/(dashboard)/Forms";
import PatientProfileModal from "@/components/view/(dashboard)/PatientProfileModal";
import { searchPatients } from "@/app/actions/patientSearchActions";
import { FhirPatient } from "@/types/global";
import { Plus, Search, UserPlus, ChevronDown, Loader, Inbox } from "lucide-react";

export default function PatientBrowserPage() {
  const { patients: recentPatients, isLoading, loadPatients } = usePatientStore();
  const { openModal, closeModal } = useDashboardModal(); // Use the global modal hook

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FhirPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleViewProfile = (patient: FhirPatient) => {
    openModal(
      <PatientProfileModal 
        patient={patient} 
        onCreateAssessment={() => handleCreateAssessment(patient)} 
      />,
      '4xl' // Specify a larger size for the profile modal
    );
  };

  const handleCreateAssessment = (patient?: FhirPatient) => {
    openModal(
      <CreateAssessmentForm onClose={closeModal} patient={patient} />,
      '2xl' // Specify a size for the assessment form
    );
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
    setIsSearching(true);
    setHasSearched(true);
    const results = await searchPatients(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
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
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-end items-center space-x-3">
          <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="btn btn-secondary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                      <a href="#" onClick={(e) => { e.preventDefault(); handleCreatePatient(); setDropdownOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">New Patient</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleCreateCarer(); setDropdownOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">New Carer</a>
                  </div>
              )}
          </div>
          <button onClick={() => handleCreateAssessment()} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Assessment
          </button>
      </div>

      {/* Main Content Area with Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b">
              <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patients by name, NHS number, etc..." 
                      className="pl-9 pr-4 py-2 w-full md:w-80 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
              </form>
          </div>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="table-header-cell">Name</th>
                          <th className="table-header-cell">User Role</th>
                          <th className="table-header-cell">Gender</th>
                          <th className="table-header-cell">Birth Date</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading || isSearching ? (
                          <tr><td colSpan={6} className="text-center p-8 text-gray-500"><Loader className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                      ) : patientsToDisplay.length > 0 ? (
                          patientsToDisplay.map((patient) => {
                              const patientName = patient.name?.[0];
                              const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A';
                              const email = patient.telecom?.find(t => t.system === 'email')?.value || 'No email';
                              const givenInitial = patientName?.given?.[0]?.[0] || 'P';
                              const familyInitial = patientName?.family?.[0] || 'A';
                              const avatar = `${givenInitial}${familyInitial}`;

                              return (
                                  <tr key={patient.id} onClick={() => handleViewProfile(patient)} className="hover:bg-gray-50 cursor-pointer">
                                      <td className="table-body-cell">
                                          <div className="flex items-center">
                                              <img src={`https://placehold.co/40x40/DBEAFE/1D4ED8?text=${avatar}`} className="w-10 h-10 rounded-full mr-4" alt={displayName} />
                                              <div>
                                                  <p className="font-medium text-gray-900">{displayName}</p>
                                                  <p className="text-sm text-gray-500">{email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="table-body-cell">
                                          {/* --- UPDATED: Show User Role instead of NHS Number --- */}
                                          <span className="px-2 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                                              {patient.resourceType || 'User'}
                                          </span>
                                      </td>
                                      <td className="table-body-cell capitalize">{patient.gender || 'N/A'}</td>
                                      <td className="table-body-cell">{patient.birthDate || 'N/A'}</td>
                                      <td className="table-body-cell">
                                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${patient.active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{patient.active ? 'active' : 'pending'}</span>
                                      </td>
                                      <td className="table-body-cell text-right">
                                          <div className="flex items-center justify-end">
                                              <button onClick={(e) => { e.stopPropagation(); handleCreateAssessment(patient); }} className="btn btn-primary text-xs">Create Assessment</button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })
                      ) : (
                          <tr><td colSpan={6} className="text-center p-12 bg-gray-50"><Inbox className="w-12 h-12 mx-auto text-gray-400" /><h3 className="mt-2 text-lg font-medium text-gray-900">No Patients Found</h3><p className="mt-1 text-sm text-gray-500">{hasSearched ? "Try adjusting your search criteria." : "Create a new patient to get started."}</p></td></tr>
                      )}
                  </tbody>
              </table>
          </div>
          <div className="p-4 flex items-center justify-between text-sm text-gray-600">
              <p>Showing 1 to {patientsToDisplay.length} of {patientsToDisplay.length} entries</p>
              <div className="flex items-center space-x-1">
                  <button className="px-2 py-1 border rounded-md hover:bg-gray-100" disabled>&laquo;</button>
                  <button className="px-3 py-1 border rounded-md bg-blue-100 text-blue-700 font-bold">1</button>
                  <button className="px-2 py-1 border rounded-md hover:bg-gray-100" disabled>&raquo;</button>
              </div>
          </div>
      </div>
    </div>
  );