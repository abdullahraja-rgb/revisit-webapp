"use client";

import React, { useState, useEffect, useCallback, useRef, FormEvent, useMemo } from 'react';
import { Search, Plus, ChevronDown, Loader, Edit, CheckCircle, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createPatient } from '@/app/actions/patientActions';
import { createAssessmentAndTasks } from '@/app/actions/assessmentActions';
import { createCarer, fetchCarersForPatient, fetchAllCarers } from '@/app/actions/carerActions';
import { FhirPatient, FhirCareTeam } from '@/types/global';
import { searchPatients } from '@/app/actions/patientSearchActions';
import { createOrganization, getOrganizationTree, OrganizationNode } from '@/app/actions/organizationActions';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { FhirOrganization } from '@/types/global';
import { createPractitioner, getOrganizations, getPractitionerEmails, createOrgAdmin, deletePractitioner} from '@/app/actions/practitionerActions'; 
import { OrganizationNode } from "@/types/global";
import { createCareTeam, getCareGroups, updateCareTeamMembers, searchPractitionersInCareTeam, deleteCareTeam} from '@/app/actions/careTeamActions';
import { searchPractitioners } from '@/app/actions/practitionerActions'; 
import { useAuthRoles } from '@/hooks/useAuthRoles';




import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);
const countryOptions = Object.entries(countries.getNames('en', { select: 'official' }));


// =====================================================================
//                          Shared Types & Constants
// =====================================================================

type FormProps = { 
    onClose: () => void;
    patient?: FhirPatient; 
};
type SubTask = { id: string; description: string; type: '3d model' | 'video' | 'image' | 'custom'; notes: string; };
type TaskBlock = { id: string; title: string; subTasks: SubTask[]; };
const homeSafetyTaskTemplate: Omit<TaskBlock, 'id'>[] = [
  { title: 'Kitchen', subTasks: [] },
  { title: 'Living Room', subTasks: [] },
  { title: 'Bathroom', subTasks: [] },
];

function isValidNhsNumber(nhsNumber: string): boolean {
  const sanitized = nhsNumber.replace(/\s/g, '');
  if (!/^\d{10}$/.test(sanitized)) return false;
  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += parseInt(sanitized[i], 10) * (10 - i);
  }
  const remainder = total % 11;
  const checkDigit = 11 - remainder;
  if (checkDigit === 11) return parseInt(sanitized[9], 10) === 0;
  if (checkDigit === 10) return false;
  return checkDigit === parseInt(sanitized[9], 10);
}

interface OrganizationNode {
  id: string;
  name: string;
  children: OrganizationNode[];
}



const getExistingOrgDetails = (nodes: OrganizationNode[]): { ids: string[], names: string[] } => {
    let ids: string[] = [];
    let names: string[] = [];
    nodes.forEach(node => {
        ids.push(node.id);
        names.push(node.name.toLowerCase());
        if (node.children && node.children.length > 0) {
            const childDetails = getExistingOrgDetails(node.children);
            ids = ids.concat(childDetails.ids);
            names = names.concat(childDetails.names);
        }
    });
    return { ids, names };
};


// =====================================================================
//                          Create Patient Form
// =====================================================================
export const CreatePatientForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const { isAdmin, isOrgAdmin } = useAuthRoles();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [nhsNumber, setNhsNumber] = useState('');
  const [mrn, setMrn] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('GB');
  const [nhsValid, setNhsValid] = useState(true);

  // Organization fields
  const [organizations, setOrganizations] = useState<FhirOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleNhsChange = (value: string) => {
    setNhsNumber(value);
    setNhsValid(value.length === 0 || isValidNhsNumber(value));
  };

  // Load organizations if user has admin permissions
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!accounts?.length || (!isAdmin && !isOrgAdmin)) return;

      setIsLoadingData(true);
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });

        const orgs = await getOrganizations(tokenResponse.accessToken);
        setOrganizations(orgs);
      } catch (error) {
        console.error("Failed to load organizations:", error);
        addToast({ 
          title: 'Error', 
          description: 'Could not load organizations. You may not have permission.', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadOrganizations();
  }, [accounts, instance, isAdmin, isOrgAdmin, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.length === 0) {
      addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenResponse = await instance.acquireTokenSilent({ 
        ...loginRequest, 
        account: accounts[0] 
      });

      const result = await createPatient(
        { 
          firstName, 
          lastName, 
          dob, 
          gender, 
          nhsNumber, 
          mrn, 
          phone, 
          addressLine, 
          city, 
          postalCode, 
          country,
          organizationId: (isAdmin || isOrgAdmin) ? selectedOrg || null : null
        },
        tokenResponse.accessToken
      );

      if (result.success) {
        addToast({ title: 'Success', description: result.message });
        onClose();
      } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Token acquisition or patient creation failed:", error);
      addToast({ 
        title: 'Error', 
        description: 'An error occurred. Please try logging in again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Patient</h2>
      </div>

      {/* Organization Select - only show for admin/orgAdmin */}
      {(isAdmin || isOrgAdmin) && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Organization</h3>
          <div>
            <label htmlFor="organization" className="form-label">Organization *</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              id="organization"
              className="form-input"
              required
              disabled={isLoadingData}
            >
              <option value="" disabled>
                {isLoadingData ? 'Loading organizations...' : 'Select an organization'}
              </option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Personal Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="form-label">First Name *</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              id="firstName" 
              className="form-input" 
              required 
            />
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">Last Name *</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              id="lastName" 
              className="form-input" 
              required 
            />
          </div>
          <div>
            <label htmlFor="dob" className="form-label">Date of Birth *</label>
            <input 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              id="dob" 
              className="form-input" 
              required 
            />
          </div>
          <div>
            <label htmlFor="gender" className="form-label">Gender</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)} 
              id="gender" 
              className="form-input"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Identifiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nhsNumber" className="form-label">NHS Number</label>
            <input 
              type="text" 
              value={nhsNumber} 
              onChange={(e) => handleNhsChange(e.target.value)} 
              id="nhsNumber" 
              placeholder="e.g., 123 456 7890" 
              className={`form-input ${nhsNumber && !nhsValid ? 'border-red-500' : ''}`}
            />
            {nhsNumber && !nhsValid && (
              <p className="text-sm text-red-600 mt-1">Invalid NHS number format</p>
            )}
          </div>
          <div>
            <label htmlFor="mrn" className="form-label">Medical Record Number (MRN)</label>
            <input 
              type="text" 
              value={mrn} 
              onChange={(e) => setMrn(e.target.value)} 
              id="mrn" 
              placeholder="e.g., STJ-A-54321" 
              className="form-input" 
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Contact & Address</h3>
        <div>
          <label htmlFor="phone" className="form-label">Phone Number</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            id="phone" 
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="addressLine" className="form-label">Address Line 1</label>
          <input 
            type="text" 
            value={addressLine} 
            onChange={(e) => setAddressLine(e.target.value)} 
            id="addressLine" 
            className="form-input" 
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="city" className="form-label">City</label>
            <input 
              type="text" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              id="city" 
              className="form-input" 
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="form-label">Postal Code</label>
            <input 
              type="text" 
              value={postalCode} 
              onChange={(e) => setPostalCode(e.target.value)} 
              id="postalCode" 
              className="form-input" 
            />
          </div>
          <div>
            <label htmlFor="country" className="form-label">Country</label>
            <select 
              value={country} 
              onChange={(e) => setCountry(e.target.value)} 
              id="country" 
              className="form-input"
            >
              {countryOptions.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button 
          type="button" 
          onClick={onClose} 
          className="btn-secondary" 
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Patient'}
        </button>
      </div>
    </form>
  );
};
// =====================================================================
//                          Create Carer Form
// =====================================================================
export const CreateCarerForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for carer information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState(''); // Kept for the UI, but not sent to backend
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  
  // State for patient search and selection
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(null);
  
  // State for relationship
  const [relationship, setRelationship] = useState('');
  
  // Effect for debouncing patient search
  useEffect(() => {
    if (!patientSearchTerm.trim()) {
      setPatientSearchResults([]);
      return;
    }
    const performSearch = async () => {
        if (accounts.length === 0) return;
        setIsPatientSearching(true);
        try {
            const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const results = await searchPatients(patientSearchTerm, tokenResponse.accessToken);
            setPatientSearchResults(results);
        } catch (error) {
            console.error("Search in form failed:", error);
        } finally {
            setIsPatientSearching(false);
        }
    };
    const timerId = setTimeout(performSearch, 300);
    return () => clearTimeout(timerId);
  }, [patientSearchTerm, accounts, instance]);

  const handlePatientSelect = (patient: FhirPatient) => {
    const patientName = patient.name?.[0];
    const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
    setPatientSearchTerm(displayName);
    setSelectedPatient(patient);
    setPatientSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const relationshipSelect = e.currentTarget.elements.namedItem("relationship") as HTMLSelectElement;
    const relationshipDisplay = relationshipSelect.options[relationshipSelect.selectedIndex].text;

    // Added validation for required fields before submitting 
    if (!selectedPatient) {
      addToast({ title: 'Error', description: 'You must select a patient.', variant: 'destructive' });
      return;
    }
    if (!relationship) {
      addToast({ title: 'Error', description: 'Please select a relationship to the patient.', variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
      addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        
        const carerPayload = {
            firstName,
            lastName,
            phone,
            gender,
            patientId: selectedPatient.id,
            patientName: patientSearchTerm, // This is the display name from the search
            relationship,
            relationshipDisplay, // Use the value captured above
        };

        const result = await createCarer(carerPayload, tokenResponse.accessToken);

        if (result.success) {
            addToast({ title: 'Success', description: result.message });
            onClose();
        } else {
            addToast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
        console.error("Token acquisition or carer creation failed:", error);
        addToast({ title: 'Error', description: 'An error occurred. Please try logging in again.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold text-gray-900">Create New Carer</h2></div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Carer Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div><label htmlFor="carerFirstName" className="form-label">First Name *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="carerFirstName" className="form-input" required /></div>
          <div><label htmlFor="carerLastName" className="form-label">Last Name *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="carerLastName" className="form-input" required /></div>
          <div><label htmlFor="carerDob" className="form-label">Date of Birth</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} id="carerDob" className="form-input" /></div>
          <div><label htmlFor="carerGender" className="form-label">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} id="carerGender" className="form-input"><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
          <div className="sm:col-span-2"><label htmlFor="carerPhone" className="form-label">Phone Number</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} id="carerPhone" placeholder="e.g., 07700 900123" className="form-input" /></div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Care Relationship</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 relative">
            <label htmlFor="patientSearch" className="form-label">Cares for Patient *</label>
            <div className="relative">
              <input type="text" id="patientSearch" placeholder="Start typing to search for a patient..." className="form-input" value={patientSearchTerm} onChange={(e) => {setPatientSearchTerm(e.target.value); setSelectedPatient(null);}} autoComplete="off" required />
              {isPatientSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
            </div>
            {patientSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {patientSearchResults.map(patient => {
                        const patientName = patient.name?.[0];
                        const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
                        return (<div key={patient.id} onClick={() => handlePatientSelect(patient)} className="px-4 py-2 hover:bg-primary-light cursor-pointer"><p className="font-medium text-neutral-800">{displayName}</p><p className="text-xs text-neutral-500">ID: {patient.id}</p></div>)
                    })}
                </div>
            )}
           </div>
          {/* Added 'required' attribute to the select element */}
          <div><label htmlFor="relationship" className="form-label">Relationship to Patient *</label><select id="relationship" name="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="form-input" required><option value="">Select relationship</option><option value="SPS">Spouse</option><option value="PRN">Parent</option><option value="CHD">Child</option><option value="OTH">Other</option></select></div>
         </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Carer'}</button>
      </div>
    </form>
  );
};
// =====================================================================
//                         Create Assessment Form
// =====================================================================

export const CreateAssessmentForm: React.FC<FormProps> = ({ onClose, patient: preselectedPatient }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [assessmentType, setAssessmentType] = useState('');
  const [performerType, setPerformerType] = useState('Patient');
  const [performerName, setPerformerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  
  // State to hold the selected carer's unique ID
  const [performerId, setPerformerId] = useState<string | null>(null);

  // Patient Search State
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(preselectedPatient || null);

  // Carer State
  const [carers, setCarers] = useState<CarerData[]>([]);
  const [isLoadingCarers, setIsLoadingCarers] = useState(false);
  const [showCarerDropdown, setShowCarerDropdown] = useState(false);

  useEffect(() => {
    if (preselectedPatient) {
      const name = preselectedPatient.name?.[0];
      const displayName = name ? `${name.given.join(' ')} ${name.family}` : preselectedPatient.id;
      setPatientSearchTerm(displayName);
      setSelectedPatient(preselectedPatient);
    }
  }, [preselectedPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      setPerformerName('');
      setCarers([]);
      setShowCarerDropdown(false);
      return;
    }

    if (performerType === 'Patient') {
      const name = selectedPatient.name?.[0];
      const displayName = name ? `${name.given.join(' ')} ${name.family}` : selectedPatient.id;
      setPerformerName(displayName);
      setCarers([]);
      setShowCarerDropdown(false);
    } else if (performerType === 'Carer') {
      setPerformerName('');
      setShowCarerDropdown(false);
      fetchCarersForPatientHandler();
    }
  }, [selectedPatient, performerType]);

  const fetchCarersForPatientHandler = async () => {
    if (!selectedPatient || accounts.length === 0) return;

    setIsLoadingCarers(true);
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const result = await fetchCarersForPatient(selectedPatient.id, tokenResponse.accessToken);

      if (result.success && result.data) {
        setCarers(result.data);
        if (result.data.length === 0) {
          addToast({
            title: 'Info',
            description: 'No carers found for this patient.',
            variant: 'default'
          });
        }
      } else {
        addToast({
          title: 'Warning',
          description: result.message || 'Could not load carers for this patient.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error("Failed to fetch carers:", error);
      addToast({
        title: 'Error',
        description: 'An error occurred while loading carers.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCarers(false);
    }
  };

  useEffect(() => {
    if (preselectedPatient || !patientSearchTerm.trim()) {
      setPatientSearchResults([]);
      return;
    }
    const performSearch = async () => {
        if (accounts.length === 0) return;
        setIsPatientSearching(true);
        try {
            const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const results = await searchPatients(patientSearchTerm, tokenResponse.accessToken);
            setPatientSearchResults(results);
        } catch (error) {
            console.error("Search in form failed:", error);
        } finally {
            setIsPatientSearching(false);
        }
    };
    const timerId = setTimeout(performSearch, 300);
    return () => clearTimeout(timerId);
  }, [patientSearchTerm, preselectedPatient, accounts, instance]);

  const handlePatientSelect = (patient: FhirPatient) => {
    const patientName = patient.name?.[0];
    const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
    setPatientSearchTerm(displayName);
    setSelectedPatient(patient);
    setPatientSearchResults([]);
    setPerformerId(null); // UPDATED: Reset carer ID when patient changes
  };

  const handlePerformerTypeChange = (newPerformerType: string) => {
    setPerformerType(newPerformerType);
    setPerformerId(null); // UPDATED: Reset carer ID when performer type changes
  };

  const handleCarerSelect = (carer: CarerData) => {
    // UPDATED: Set both the display name and the unique ID
    setPerformerName(carer.displayName || carer.name || `${carer.firstName} ${carer.lastName}`);
    setPerformerId(carer.id);
    setShowCarerDropdown(false);
  };

  const handlePerformerNameChange = (value: string) => {
    setPerformerName(value);
    setPerformerId(null); // If user types manually, we don't have an ID
    if (performerType === 'Carer' && carers.length > 0 && value === '') {
      setShowCarerDropdown(true);
    } else {
      setShowCarerDropdown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // VALIDATED FIELDS BEFORE SUBMITTING 
    if (!selectedPatient) {
      addToast({ title: 'Error', description: 'You must select a patient.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    if (!assessmentType) {
      addToast({ title: 'Error', description: 'Please select an assessment type.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    if (!performerName) {
      addToast({ title: 'Error', description: 'Performer name is required.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }
    if (!startDate || !endDate) {
      addToast({ title: 'Error', description: 'Both start and end dates are required.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    if (accounts.length === 0) {
      addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const assessmentData = {
        serviceRequest: {
          patient: selectedPatient.id,
          assessmentType,
          performerType,
          performerName,
          startDate,
          endDate,
          description,
          performerId: performerType === 'Carer' ? performerId : null,
        },
      };

      const result = await createAssessmentAndTasks(assessmentData, tokenResponse.accessToken);

      if (result.success) {
        addToast({ title: 'Success', description: result.message });
        onClose();
      } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Token acquisition or assessment creation failed:", error);
      addToast({ title: 'Error', description: 'An error occurred. Please try logging in again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold text-gray-900">Create New Assessment</h2></div>
      <div className="space-y-6">
        <div className="relative">
            <label className="form-label">Patient *</label>
            <div className="relative">
                <input type="text" placeholder="Search patient by name or DOB" className="form-input" value={patientSearchTerm} onChange={(e) => {setPatientSearchTerm(e.target.value); if (selectedPatient) setSelectedPatient(null);}} required disabled={!!preselectedPatient} autoComplete="off" />
                {isPatientSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
            </div>
            {patientSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {patientSearchResults.map(patient => {
                        const patientName = patient.name?.[0];
                        const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
                        return (<div key={patient.id} onClick={() => handlePatientSelect(patient)} className="px-4 py-2 hover:bg-primary-light cursor-pointer"><p className="font-medium text-neutral-800">{displayName}</p><p className="text-xs text-neutral-500">ID: {patient.id}</p></div>)
                    })}
                </div>
            )}
        </div>
        <div><label className="form-label">Type of Assessment *</label><select className="form-input" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} required><option value="">Select type</option><option>Standard Home Safety Check</option><option>Follow-up Assessment</option><option>Initial Consultation</option></select></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label className="form-label">Performer Type</label>
                <select className="form-input" value={performerType} onChange={(e) => handlePerformerTypeChange(e.target.value)}>
                    <option>Patient</option>
                    <option>Carer</option>
                </select>
            </div>
            <div>
                <label className="form-label">Performer Name</label>
                {performerType === 'Patient' ? (
                    <input
                        type="text"
                        placeholder="Patient name will auto-fill"
                        className="form-input bg-gray-50"
                        value={performerName}
                        readOnly
                    />
                ) : (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={isLoadingCarers ? "Loading carers..." : carers.length === 0 ? "No carers found" : "Select or type carer name"}
                            className="form-input"
                            value={performerName}
                            onChange={(e) => handlePerformerNameChange(e.target.value)}
                            onFocus={() => {
                                if (carers.length > 0 && !performerName) {
                                    setShowCarerDropdown(true);
                                }
                            }}
                            disabled={isLoadingCarers}
                        />
                        {isLoadingCarers && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                        {showCarerDropdown && carers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {carers.map(carer => (
                                    <div
                                        key={carer.id}
                                        onClick={() => handleCarerSelect(carer)}
                                        className="px-4 py-2 hover:bg-primary-light cursor-pointer"
                                    >
                                        <p className="font-medium text-neutral-800">
                                            {carer.displayName || carer.name || `${carer.firstName} ${carer.lastName}`}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            Relationship: {carer.relationshipDisplay || carer.relationship}
                                        </p>
                                        {carer.phone && (
                                            <p className="text-xs text-neutral-500">
                                                Phone: {carer.phone}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                <div className="px-4 py-2 text-xs text-neutral-400 border-t">
                                    Click to select a carer or type manually
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="form-label">End Date</label><input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="form-label">
          Description / Context for Mobile App
        </label>
        <textarea
          id="description"
          className="form-input"
          rows={4}
          placeholder="Enter any general instructions or context for the person performing the assessment..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          This information will be displayed as context on the mobile app.
        </p>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>
    </form>
  );
};

// -------------------------------------------------------------------------------------------
//                      PRACTITIONER FORM
// -------------------------------------------------------------------------------------------

export const CreatePractitionerForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');

  const [organizations, setOrganizations] = useState<FhirOrganization[]>([]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (accounts.length > 0) {
        setIsLoadingData(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });

          const [orgs, emails] = await Promise.all([
            getOrganizations(tokenResponse.accessToken),
            getPractitionerEmails(tokenResponse.accessToken)
          ]);

          setOrganizations(orgs);
          setExistingEmails(emails.map(e => e.toLowerCase()));
        } catch (error) {
          console.error("Failed to load form data:", error);
          addToast({ title: 'Error', description: 'Could not load necessary data for this form.', variant: 'destructive' });
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    loadFormData();
  }, [accounts, instance, addToast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (email && existingEmails.includes(email.toLowerCase())) {
        setEmailError('This email is already in use by another practitioner.');
      } else {
        setEmailError(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [email, existingEmails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) {
      addToast({ title: 'Validation Error', description: emailError, variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
      addToast({ title: 'Authentication Error', description: 'No signed-in user found.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });

      const result = await createPractitioner(
        { firstName, lastName, email, tenantId },
        tokenResponse.accessToken
      );

      if (result.success) {
        addToast({ title: 'Success', description: result.message });
        onClose();
      } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Token acquisition or form submission failed:", error);
      addToast({ title: 'Error', description: 'Could not process the request. Please try logging in again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Practitioner</h2>
        <p className="text-neutral-500 mt-1">This will create a user in Entra ID and send them an invitation email.</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Practitioner Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="form-label">First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="firstName" className="form-input" required />
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="lastName" className="form-input" required />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            placeholder="practitioner@hospital.com"
            className={`form-input ${emailError ? 'border-red-500' : ''}`}
            required
          />
          {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
        </div>
        <div>
          <label htmlFor="tenantId" className="form-label">Organization *</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            id="tenantId"
            className="form-input"
            required
            disabled={isLoadingData}
          >
            <option value="" disabled>{isLoadingData ? 'Loading organizations...' : 'Select an organization'}</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !!emailError}>
          {isSubmitting ? 'Sending Invitation...' : 'Create & Invite Practitioner'}
        </button>
      </div>
    </form>
  );
};

//==========================================================================================
//                     ORGANISATION FORM
//==========================================================================================


export const CreateOrganizationForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  // Get 'inProgress' state to solve the authentication race condition
  const { instance, accounts, inProgress } = useMsal();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [odsCode, setOdsCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('GB');
  const [partOf, setPartOf] = useState<string | null>(null);

  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([]);
  const [existingOrgIds, setExistingOrgIds] = useState<string[]>([]);
  const [existingOrgNames, setExistingOrgNames] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const userRoles = useMemo(() => {
    if (accounts.length > 0 && accounts[0].idTokenClaims) {
      return (accounts[0].idTokenClaims.roles as string[]) || [];
    }
    return [];
  }, [accounts]);

  const isAdmin = useMemo(() => userRoles.includes('Admin'), [userRoles]);

  const slugify = useCallback((text: string) => {
    let baseSlug = text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
    if (!baseSlug) return '';
    if (existingOrgIds.includes(baseSlug)) {
      let counter = 2;
      while (existingOrgIds.includes(`${baseSlug}-${counter}`)) {
        counter++;
      }
      return `${baseSlug}-${counter}`;
    }
    return baseSlug;
  }, [existingOrgIds]);

  useEffect(() => {
    if (!isIdManuallyEdited) {
      setId(slugify(name));
    }
  }, [name, isIdManuallyEdited, slugify]);

  useEffect(() => {
    const loadOrgData = async () => {
      // Only run if authentication is complete AND we have an account.
      if (inProgress === "none" && accounts.length > 0) {
        setIsLoadingData(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const response = await getOrganizationTree(tokenResponse.accessToken);
          
          // --- CONSOLE LOG #1: What is the server action returning to the component? ---
          console.log("API Response received in form:", response);

          setOrganizationTree(response?.tree ?? []);
          setExistingOrgIds(response?.existingIds ?? []);
          setExistingOrgNames(response?.existingNames?.map(n => n.toLowerCase()) ?? []);

        } catch (error) {
          console.error("Failed to load organization data:", error);
          addToast({ title: 'Error', description: 'Could not load organizations.', variant: 'destructive' });
          setOrganizationTree([]);
          setExistingOrgIds([]);
          setExistingOrgNames([]);
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    loadOrgData();
  }, [accounts, instance, inProgress, addToast]); // Added 'inProgress' to dependency array

  useEffect(() => {
    const handler = setTimeout(() => {
      if (name && existingOrgNames.includes(name.toLowerCase())) {
        setNameError('This organization name is already in use.');
      } else {
        setNameError(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [name, existingOrgNames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !phone || !email || !addressLine || !city || !postalCode || !country) {
      addToast({ title: "Validation Error", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }

    if (!isAdmin && !partOf) {
        addToast({ title: "Validation Error", description: "You must select a parent organization.", variant: "destructive" });
        return;
    }

    if (nameError) {
      addToast({ title: 'Validation Error', description: nameError, variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
      addToast({ title: "Auth Error", description: "No user signed in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const result = await createOrganization(
        { name, id, odsCode, phone, email, addressLine, city, postalCode, country, partOf },
        tokenResponse.accessToken
      );
      if (result.success) {
        addToast({ title: "Success", description: result.message });
        onClose();
      } else {
        addToast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      addToast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOrgOptions = (nodes: OrganizationNode[], depth = 0): JSX.Element[] => {
    return nodes.flatMap((node) => [
      <option key={node.id} value={node.id}>
        {" ".repeat(depth * 2)}{depth > 0 && '└ '}{node.name}
      </option>,
      ...(node.children ? renderOrgOptions(node.children, depth + 1) : []),
    ]);
  };

  // --- CONSOLE LOG #2: What is the state variable being used for validation? ---
  console.log("Current 'existingOrgNames' state for validation:", existingOrgNames);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold">Create New Organization</h2></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label">Name *</label>
          <div className="relative">
            <input value={name} onChange={(e) => setName(e.target.value)} className={`form-input pr-10 ${nameError ? 'border-red-500' : ''}`} required />
            {name && !nameError && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
          </div>
          {nameError && <p className="text-sm text-red-600 mt-1">{nameError}</p>}
        </div>

        <div>
          <label className="form-label">ID *</label>
          <div className="flex items-center gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} className="form-input" required disabled={!isIdManuallyEdited} />
            <button type="button" onClick={() => setIsIdManuallyEdited(!isIdManuallyEdited)} className="btn-secondary p-2" title="Manually edit ID"><Edit className="w-4 h-4" /></button>
          </div>
          {!isIdManuallyEdited && <p className="text-xs text-neutral-500 mt-1">ID is auto-generated. Click edit to change it manually.</p>}
        </div>

        <div>
          <label className="form-label">Phone *</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" required />
        </div>

        <div>
          <label className="form-label">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" required />
        </div>

        <div>
          <label className="form-label">Address Line *</label>
          <input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="form-input" required />
        </div>

        <div>
          <label className="form-label">City *</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="form-input" required />
        </div>

        <div>
          <label className="form-label">Postal Code *</label>
          <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="form-input" required />
        </div>

        <div>
          <label className="form-label">Country *</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="form-input" required>
            {countryOptions.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">ODS Code</label>
          <input value={odsCode} onChange={(e) => setOdsCode(e.target.value)} className="form-input" placeholder="e.g., RR8" />
        </div>

        <div className="col-span-full">
          <label className="form-label">Parent Organization</label>
          <select value={partOf || ""} onChange={(e) => setPartOf(e.target.value || null)} className="form-input" disabled={isLoadingData}>
            {isAdmin && <option value="">None (Top-Level Organization)</option>}
            {renderOrgOptions(organizationTree)}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-8">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !!nameError}>
          {isSubmitting ? "Saving..." : "Create Organization"}
        </button>
      </div>
    </form>
  );
};

// =====================================================================
//                        Create Care Group Form
// =====================================================================
// =====================================================================
export const CreateCareGroupForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [members, setMembers] = useState<FhirPractitioner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FhirPractitioner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [organizations, setOrganizations] = useState<FhirOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  useEffect(() => {
    const loadOrgs = async () => {
      if (accounts.length > 0) {
        setIsLoadingOrgs(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const orgs = await getOrganizations(tokenResponse.accessToken);
          setOrganizations(orgs);
          // Automatically select the first organization if available
          if (orgs.length > 0) {
            setSelectedOrgId(orgs[0].id);
          }
        } catch (error) {
          addToast({ title: 'Error', description: 'Could not load organizations.', variant: 'destructive' });
        } finally {
          setIsLoadingOrgs(false);
        }
      }
    };
    loadOrgs();
  }, [accounts, instance, addToast]);

  useEffect(() => {
    if (!searchTerm.trim() || !selectedOrgId) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (accounts.length > 0) {
        setIsSearching(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const results = await searchPractitioners(searchTerm, selectedOrgId, tokenResponse.accessToken);
          setSearchResults(results.filter(p => !members.some(m => m.id === p.id)));
        } catch (error) {
          console.error("Practitioner search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedOrgId, accounts, instance, members]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setMembers([]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const addMember = (practitioner: FhirPractitioner) => {
    setMembers(prev => [...prev, practitioner]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeMember = (practitionerId: string) => {
    setMembers(prev => prev.filter(p => p.id !== practitionerId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation for organization selection**
    if (!selectedOrgId) {
        addToast({ title: 'Validation Error', description: 'Please select an organization.', variant: 'destructive' });
        return;
    }
    if (members.length < 2) {
      addToast({ title: 'Validation Error', description: 'A care group must have at least two members.', variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
        addToast({ title: 'Authentication Error', description: 'No signed-in user found.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        
        // Include the `organizationId` in the data object
        const result = await createCareTeam(
            { 
              name, 
              memberIds: members.map(m => m.id),
              organizationId: selectedOrgId // This was the missing piece
            },
            tokenResponse.accessToken
        );

        if (result.success) {
            addToast({ title: 'Success', description: result.message });
            onClose();
        } else {
            addToast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
        addToast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold">Create New Care Group</h2></div>
      <div className="space-y-6">
        <div>
          <label className="form-label">Group Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
        </div>
        <div>
          <label className="form-label">Organization *</label>
          <select value={selectedOrgId || ''} onChange={(e) => handleOrgChange(e.target.value)} className="form-input" required disabled={isLoadingOrgs}>
            <option value="" disabled>{isLoadingOrgs ? 'Loading organizations...' : 'Select an organization'}</option>
            {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </div>
        <div className="relative">
          <label className="form-label">Add Members *</label>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="form-input" 
            placeholder="Search for practitioners by name..."
            disabled={!selectedOrgId || isLoadingOrgs}
          />
          {isSearching && <Loader className="absolute right-3 top-10 w-4 h-4 animate-spin text-primary" />}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
              {searchResults.map(p => (
                <div key={p.id} onClick={() => addMember(p)} className="px-4 py-2 hover:bg-primary-light cursor-pointer">
                  <p>{p.name?.[0]?.given.join(' ')} {p.name?.[0]?.family}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Selected Members:</h4>
          <div className="space-y-2">
            {members.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-neutral-100 p-2 rounded-md">
                <p>{p.name?.[0]?.given.join(' ')} {p.name?.[0]?.family}</p>
                <button type="button" onClick={() => removeMember(p.id)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                  <X size={16} />
                </button>
              </div>
            ))}
            {members.length === 0 && <p className="text-xs text-neutral-500">No members added yet. Select an organization to begin.</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t mt-8">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>Create Group</button>
      </div>
    </form>
  );
};


// =======================================================
// ORGANSIATIONAL ADMIN
// =======================================================

export const CreateOrganizationAdminForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [organizations, setOrganizations] = useState<FhirOrganization[]>([]);
  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadFormData = async () => {
      if (accounts.length > 0) {
        setIsLoadingData(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });

          const [orgs, emails] = await Promise.all([
            getOrganizations(tokenResponse.accessToken),
            getPractitionerEmails(tokenResponse.accessToken)
          ]);

          setOrganizations(orgs);
          setExistingEmails(emails.map(e => e.toLowerCase()));
        } catch (error) {
          console.error("Failed to load form data:", error);
          addToast({ title: 'Error', description: 'Could not load necessary data for this form.', variant: 'destructive' });
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    loadFormData();
  }, [accounts, instance, addToast]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (email && existingEmails.includes(email.toLowerCase())) {
        setEmailError('This email is already in use.');
      } else {
        setEmailError(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [email, existingEmails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) {
      addToast({ title: 'Validation Error', description: emailError, variant: 'destructive' });
      return;
    }

    if (accounts.length === 0) {
      addToast({ title: 'Authentication Error', description: 'No signed-in user found.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });

      const result = await createOrgAdmin(
        { firstName, lastName, email, tenantId },
        tokenResponse.accessToken
      );

      if (result.success) {
        addToast({ title: 'Success', description: result.message });
        onClose();
      } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Submission failed:", error);
      addToast({ title: 'Error', description: 'Failed to send invitation. Try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Organization Admin</h2>
        <p className="text-neutral-500 mt-1">
          This will create a user in Entra ID, assign the OrgAdmin role, and send an invitation.
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Admin Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="form-label">First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="firstName" className="form-input" required />
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="lastName" className="form-input" required />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="form-label">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="email"
            placeholder="admin@organization.com"
            className={`form-input ${emailError ? 'border-red-500' : ''}`}
            required
          />
          {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="tenantId" className="form-label">Organization *</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            id="tenantId"
            className="form-input"
            required
            disabled={isLoadingData}
          >
            <option value="" disabled>{isLoadingData ? 'Loading organizations...' : 'Select an organization'}</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !!emailError}>
          {isSubmitting ? 'Sending Invitation...' : 'Create & Invite Admin'}
        </button>
      </div>
    </form>
  );
};


export const ManageCareGroups: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [careGroups, setCareGroups] = useState<FhirCareTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<FhirCareTeam | null>(null);

  // State to track which item is being deleted for UI feedback
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCareGroups = useCallback(async () => {
    if (accounts.length > 0) {
      setIsLoading(true);
      try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        const groups = await getCareGroups(tokenResponse.accessToken);
        setCareGroups(groups);
      } catch (error) {
        addToast({ title: 'Error', description: 'Could not load care groups.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [accounts, instance, addToast]);

  useEffect(() => {
    loadCareGroups();
  }, [loadCareGroups]);

  // NEW: Handler for care group updates from the edit form
  const handleCareGroupUpdated = useCallback((updatedGroup: FhirCareTeam) => {
    // Update the specific care group in the list immediately
    setCareGroups(prevGroups => 
      prevGroups.map(group => 
        group.id === updatedGroup.id ? updatedGroup : group
      )
    );
    
    // CRITICAL: Force update the editing group to trigger re-render with fresh data
    setEditingGroup(updatedGroup);

    // Optional: Show a subtle success message
    console.log('Care group updated in parent:', updatedGroup.name, 'Members:', updatedGroup.participant?.length || 0);
  }, []);

  // IMPROVED: Simplified edit success handler - no need to reload everything
  const handleEditSuccess = () => {
    setEditingGroup(null);
    addToast({ 
      title: 'Success', 
      description: 'Care team management completed successfully.' 
    });
    // No need to call loadCareGroups() anymore since updates happen in real-time
  };

  // Handler for the delete button click
  const handleDelete = async (teamId: string, teamName: string) => {
    // Safety first: always confirm a destructive action
    if (!window.confirm(`Are you sure you want to delete the care group "${teamName}"?\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingId(teamId); // Show a loading spinner on the specific button
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const result = await deleteCareTeam(teamId, tokenResponse.accessToken);

      if (result.success) {
        addToast({ title: 'Success', description: result.message, variant: 'default' });
        // Update UI instantly for a better user experience
        setCareGroups(prevGroups => prevGroups.filter(group => group.id !== teamId));
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      addToast({ title: 'Error', description: error.message || 'Failed to delete care group.', variant: 'destructive' });
    } finally {
      setDeletingId(null); // Hide the loading spinner
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="w-full">
      {editingGroup ? (
        <EditCareGroupForm 
          group={editingGroup} 
          onBack={() => setEditingGroup(null)} 
          onSuccess={handleEditSuccess}
          onCareGroupUpdated={handleCareGroupUpdated} // NEW: Pass the update callback
        />
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Manage Care Groups</h2>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {careGroups.length > 0 ? careGroups.map(group => (
              <div key={group.id} className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg border">
                <div>
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-sm text-neutral-500">
                    {group.participant?.length || 0} member{(group.participant?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setEditingGroup(group)} className="btn-secondary">
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(group.id!, group.name!)}
                    disabled={deletingId === group.id}
                    className="btn-danger w-12 h-10 flex items-center justify-center disabled:opacity-50"
                    aria-label={`Delete ${group.name}`}
                  >
                    {deletingId === group.id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )) : <p className="text-center text-neutral-500 py-8">No care groups found.</p>}
          </div>
        </div>
      )}
    </div>
  );
};


export const EditCareGroupForm = ({
  group,
  onBack,
  onSuccess,
  onCareGroupUpdated, // NEW: Add this prop to notify parent
}: {
  group: FhirCareTeam;
  onBack: () => void;
  onSuccess: () => void;
  onCareGroupUpdated?: (updatedGroup: FhirCareTeam) => void; // NEW: Optional callback
}) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();

  const [members, setMembers] = useState<FhirPractitioner[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FhirPractitioner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<string>>(new Set());
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Abort controller ref for cancelling in-flight searches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Extract organization info for display and searching
  const getOrganizationInfo = () => {
    console.log("Debug - Full group object:", group);
    console.log("Debug - group._orgId:", group._orgId);
    console.log("Debug - group._orgName:", group._orgName);
    console.log("Debug - group.managingOrganization:", group.managingOrganization);
   
    console.log("Debug - group.meta:", group.meta);
    if (group.meta?.security) {
      group.meta.security.forEach((sec, index) => {
        console.log(`Debug - security[${index}]:`, sec);
      });
    }
   
    // Use enriched data from backend (preferred)
    if (group._orgId) {
      console.log("Using enriched data:", { id: group._orgId, name: group._orgName });
      return {
        id: group._orgId,
        name: group._orgName || `Organization ${group._orgId}`
      };
    }
   
    // Fallback: extract from managingOrganization
    if (group.managingOrganization?.length > 0) {
      const orgRef = group.managingOrganization[0].reference;
      const orgDisplay = group.managingOrganization[0].display;
      const orgId = orgRef ? orgRef.split('/')[1] : null;
      console.log("Using fallback data:", { id: orgId, name: orgDisplay });
      return { id: orgId, name: orgDisplay || `Organization ${orgId}` };
    }
   
    console.log("No organization info found");
    return null;
  };

  const orgInfo = getOrganizationInfo();

  // Load existing members - only run once on initial load
  useEffect(() => {
    if (hasInitialized) return;

    if (group.participant?.length > 0) {
      const parsedMembers = group.participant
        .map((p) => {
          if (!p.member?.reference) return null;
          const display = p.member.display || "Unknown Name";
          const nameParts = display.split(" ");
          const lastName = nameParts.pop() || "";
          const firstName = nameParts.join(" ");
          const id = p.member.reference.split("/")[1];
          if (!id) return null;
          return {
            resourceType: "Practitioner",
            id,
            name: [{ given: [firstName], family: lastName }],
          };
        })
        .filter((p): p is FhirPractitioner => p !== null);
      setMembers(parsedMembers);
    } else {
      setMembers([]);
    }
    setIsLoadingMembers(false);
    setHasInitialized(true);
  }, [group, hasInitialized]);

  // Update search results when members change to avoid duplicates
  useEffect(() => {
    if (searchResults.length > 0) {
      const currentMemberIds = new Set(members.map((m) => m.id));
      const filteredResults = searchResults.filter((p) => !currentMemberIds.has(p.id));
     
      if (filteredResults.length !== searchResults.length) {
        setSearchResults(filteredResults);
        setSelectedSearchResults(prev => {
          const newSet = new Set(prev);
          const validIds = new Set(filteredResults.map(p => p.id));
          return new Set([...newSet].filter(id => validIds.has(id)));
        });
      }
    }
  }, [members, searchResults]);

  // Debounced Practitioner Search
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      setSelectedSearchResults(new Set());
      return;
    }

    const handler = setTimeout(async () => {
      if (!accounts.length) return;

      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSearching(true);

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        const results = await searchPractitionersInCareTeam(
          group.id,
          searchTerm.trim(),
          tokenResponse.accessToken,
          orgInfo?.id
        );

        const currentMemberIds = new Set(members.map((m) => m.id));
        const filteredResults = results.filter((p) => !currentMemberIds.has(p.id));
        setSearchResults(filteredResults);
        setSelectedSearchResults(new Set());
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }
        console.error("Practitioner search failed:", error);
        addToast({
          title: "Error",
          description: "Practitioner search failed.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, group.id, members, accounts, instance, addToast]);

  // IMPROVED: Better refresh function that returns the updated group
  const refreshFormData = useCallback(async (): Promise<FhirCareTeam | null> => {
    if (!accounts.length) return null;
   
    try {
      console.log('Refreshing form data for group:', group.id);
      
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
     
      // Fetch updated care team data
      const response = await fetch(`/api/care-teams/${group.id}`, {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
        },
      });
     
      if (response.ok) {
        const updatedGroup = await response.json();
        console.log('Fetched updated group:', updatedGroup.name, 'Members:', updatedGroup.participant?.length || 0);
       
        // CRITICAL: Notify parent component FIRST
        if (onCareGroupUpdated) {
          onCareGroupUpdated(updatedGroup);
        }

        return updatedGroup;
      }
    } catch (error) {
      console.error("Failed to refresh form data:", error);
    }
    return null;
  }, [accounts, instance, group.id, onCareGroupUpdated]);

  // Update members on backend
  const handleUpdateMembers = useCallback(
    async (updatedMemberIds: string[]) => {
      if (!accounts.length) {
        addToast({
          title: "Error",
          description: "No authenticated account.",
          variant: "destructive",
        });
        return false;
      }
      setIsSubmitting(true);
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        const result = await updateCareTeamMembers(
          group.id,
          updatedMemberIds,
          tokenResponse.accessToken
        );
        if (result.success) {
          addToast({ title: "Success", description: "Care team updated." });
          return true;
        } else {
          addToast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        addToast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [group.id, accounts, instance, addToast]
  );

  // Toggle search result selection
  const toggleSearchResultSelection = (practitionerId: string) => {
    setSelectedSearchResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(practitionerId)) {
        newSet.delete(practitionerId);
      } else {
        newSet.add(practitionerId);
      }
      return newSet;
    });
  };

  // IMPROVED: Add selected practitioners with optimistic updates
  const addSelectedPractitioners = async () => {
    if (selectedSearchResults.size === 0) return;

    const practitionersToAdd = searchResults.filter(p => selectedSearchResults.has(p.id));
    const newMemberIds = [...members.map((m) => m.id), ...practitionersToAdd.map(p => p.id)];
   
    // Mark these practitioners as pending
    setPendingOperations(prev => new Set([...prev, ...practitionersToAdd.map(p => p.id)]));

    // IMPROVED: Optimistic update - add to UI immediately
    const optimisticMembers = [
      ...members,
      ...practitionersToAdd.map(p => ({
        resourceType: "Practitioner" as const,
        id: p.id,
        name: p.name || [{ given: [""], family: "" }],
      }))
    ];
    setMembers(optimisticMembers);

    // Clear search immediately for better UX
    setSearchTerm("");
    setSearchResults([]);
    setSelectedSearchResults(new Set());

    const success = await handleUpdateMembers(newMemberIds);
   
    if (success) {
      // Refresh to get the latest data from server
      await refreshFormData();
     
      addToast({
        title: "Success",
        description: `${practitionersToAdd.length} practitioner(s) added successfully.`
      });
      onSuccess();
    } else {
      // IMPROVED: Rollback optimistic update on failure
      setMembers(members); // Revert to original members
      addToast({
        title: "Error",
        description: "Failed to add practitioners. Please try again.",
        variant: "destructive"
      });
    }
   
    // Clear pending operations
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      practitionersToAdd.forEach(p => newSet.delete(p.id));
      return newSet;
    });
  };

  // Toggle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // IMPROVED: Remove selected members with optimistic updates
  const removeSelectedMembers = async () => {
    if (selectedMembers.size === 0) return;

    const selectedIds = Array.from(selectedMembers);
   
    // Mark as pending operations
    setPendingOperations(prev => new Set([...prev, ...selectedIds]));

    // IMPROVED: Optimistic update - remove from UI immediately
    const optimisticMembers = members.filter(p => !selectedIds.includes(p.id));
    const originalMembers = [...members]; // Keep reference to original for rollback
    setMembers(optimisticMembers);
    setSelectedMembers(new Set()); // Clear selections immediately

    // Update backend
    const newMemberIds = optimisticMembers.map(m => m.id);
    const success = await handleUpdateMembers(newMemberIds);
   
    if (success) {
      // Refresh form data to ensure consistency
      await refreshFormData();
     
      addToast({
        title: "Success",
        description: `${selectedIds.length} member(s) removed successfully.`
      });
      onSuccess();
    } else {
      // IMPROVED: Rollback optimistic update on failure
      setMembers(originalMembers);
      addToast({
        title: "Error",
        description: "Failed to remove members. Please try again.",
        variant: "destructive"
      });
    }
   
    // Clear pending operations
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      selectedIds.forEach(id => newSet.delete(id));
      return newSet;
    });
  };

  // Clear search and selections
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedSearchResults(new Set());
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-sm font-medium text-blue-600 mb-4 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to List
      </button>

      <h3 className="text-xl font-bold mb-4">Editing: {group.name}</h3>

      <div className="space-y-6 relative">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Add Members
          </label>
          {orgInfo && (
            <p className="text-xs text-gray-500 mt-1">
              Searching practitioners from: {orgInfo.name || `Organization ${orgInfo.id}`}
            </p>
          )}
        </div>
       
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for practitioners by name..."
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          {isSearching && (
            <Loader className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-blue-600" />
          )}
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-8 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Search Results ({searchResults.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = new Set(searchResults.map(p => p.id));
                      setSelectedSearchResults(allIds);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                    disabled={isSubmitting}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSearchResults(new Set())}
                    className="text-xs text-gray-600 hover:underline"
                    disabled={isSubmitting}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
           
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors ${
                    pendingOperations.has(p.id) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSearchResults.has(p.id)}
                      onChange={() => toggleSearchResultSelection(p.id)}
                      disabled={pendingOperations.has(p.id)}
                      className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {p.name?.[0]?.given?.join(" ")} {p.name?.[0]?.family || ""}
                      </p>
                      {p.telecom?.find(t => t.system === 'email')?.value && (
                        <p className="text-xs text-gray-500 mt-1">
                          {p.telecom.find(t => t.system === 'email')?.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
           
            {selectedSearchResults.size > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={addSelectedPractitioners}
                  disabled={isSubmitting || selectedSearchResults.size === 0}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add {selectedSearchResults.size} Selected Practitioner{selectedSearchResults.size > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-base font-medium text-gray-800">
            Current Members ({members.length}):
          </h4>
          {members.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allMemberIds = new Set(members.map(m => m.id));
                  setSelectedMembers(allMemberIds);
                }}
                className="text-xs text-blue-600 hover:underline"
                disabled={isSubmitting}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedMembers(new Set())}
                className="text-xs text-gray-600 hover:underline"
                disabled={isSubmitting}
              >
                Clear
              </button>
            </div>
          )}
        </div>
       
        <div className="border rounded-md bg-gray-50">
          {isLoadingMembers ? (
            <div className="flex justify-center p-6">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto p-3">
              {members.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center bg-white p-3 rounded-md shadow-sm border transition-opacity ${
                    pendingOperations.has(p.id) ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(p.id)}
                    onChange={() => toggleMemberSelection(p.id)}
                    disabled={pendingOperations.has(p.id)}
                    className="mr-3 h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <p className="text-sm text-gray-900 flex-1">
                    {p.name?.[0]?.given?.join(" ")} {p.name?.[0]?.family}
                  </p>
                  {pendingOperations.has(p.id) && (
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
              ))}
             
              {selectedMembers.size > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={removeSelectedMembers}
                    disabled={isSubmitting}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Remove {selectedMembers.size} Selected Member{selectedMembers.size > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">This group has no members.</p>
              <p className="text-xs text-gray-400 mt-1">Search above to add practitioners to this care team.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end">
        <button
          type="button"
          onClick={onSuccess}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          disabled={isSubmitting}
        >
          Done
        </button>
      </div>
    </div>
  );
};

// =====================================================================
//                        Manage Practitioners Component
// =====================================================================
export const ManagePractitioners: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();

  const [organizations, setOrganizations] = useState<OrganizationNode[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FhirPractitioner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch the correct organization tree based on the user's role
  useEffect(() => {
    const loadOrgs = async () => {
      if (accounts.length > 0) {
        setIsLoading(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          // The backend automatically returns the correct tree based on the user's role (Humant Admin vs. Org Admin)
          const { tree } = await getOrganizationTree(tokenResponse.accessToken);
          setOrganizations(tree);
        } catch (error) {
          addToast({ title: 'Error', description: 'Could not load organizations.', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadOrgs();
  }, [accounts, instance, addToast]);

  // Debounced search for practitioners
  useEffect(() => {
    if (!searchTerm.trim() || !selectedOrgId) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      if (accounts.length > 0) {
        setIsSearching(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const results = await searchPractitioners(searchTerm, selectedOrgId, tokenResponse.accessToken);
          setSearchResults(results);
        } catch (error) {
          console.error("Practitioner search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedOrgId, accounts, instance]);

  const handleDelete = async (practitioner: FhirPractitioner) => {
    const practitionerName = `${practitioner.name?.[0].given.join(' ')} ${practitioner.name?.[0].family}`;
    if (!window.confirm(`Are you sure you want to deactivate ${practitionerName}?`)) {
      return;
    }
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const result = await deletePractitioner(practitioner.id, tokenResponse.accessToken);
      if (result.success) {
        addToast({ title: 'Success', description: result.message });
        // Refresh search results to show the updated "Inactive" status
        const updatedResults = searchResults.map(p => 
          p.id === practitioner.id ? { ...p, active: false } : p
        );
        setSearchResults(updatedResults);
      } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      addToast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const renderOrgOptions = (nodes: OrganizationNode[], depth = 0): JSX.Element[] => {
    return nodes.flatMap((node) => [
      <option key={node.id} value={node.id}>
        {"—".repeat(depth)} {node.name}
      </option>,
      ...(node.children ? renderOrgOptions(node.children, depth + 1) : []),
    ]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Practitioners</h2>
      <div>
          <label className="form-label">Select an Organization to Manage *</label>
          <select value={selectedOrgId || ''} onChange={(e) => setSelectedOrgId(e.target.value)} className="form-input" required disabled={isLoading}>
            <option value="" disabled>{isLoading ? 'Loading...' : 'Select an organization'}</option>
            {renderOrgOptions(organizations)}
          </select>
      </div>
      <div>
          <label className="form-label">Search Practitioners by Name</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="form-input" 
              placeholder="Start typing to find practitioners..."
              disabled={!selectedOrgId}
            />
            {isSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
          </div>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto p-1">
        {searchResults.map(p => (
          <div key={p.id} className="flex items-center justify-between bg-neutral-50 p-3 rounded-md border">
            <div>
                <p className="font-medium">{p.name?.[0]?.given.join(' ')} {p.name?.[0]?.family}</p>
                <p className={`text-xs font-bold ${p.active ? 'text-green-600' : 'text-red-600'}`}>{p.active ? 'Active' : 'Inactive'}</p>
            </div>
            {p.active && (
              <button onClick={() => handleDelete(p)} className="btn-destructive-secondary">
                  <Trash2 className="w-4 h-4 mr-2" /> Deactivate
              </button>
            )}
          </div>
        ))}
        {searchTerm && searchResults.length === 0 && !isSearching && (
            <p className="text-center text-sm text-neutral-500 py-4">No practitioners found matching your search.</p>
        )}
      </div>
    </div>
  );
};