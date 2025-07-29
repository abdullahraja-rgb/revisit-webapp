"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronDown, Loader, Edit, CheckCircle } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createPatient } from '@/app/actions/patientActions';
import { createAssessmentAndTasks } from '@/app/actions/assessmentActions';
import { createCarer } from '@/app/actions/carerActions';
import { FhirPatient } from '@/types/global';
import { searchPatients } from '@/app/actions/patientSearchActions';
import { createOrganization, getOrganizationTree, OrganizationNode } from '@/app/actions/organizationActions';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { FhirOrganization } from '@/types/global';
import { createPractitioner, getOrganizations, getPractitionerEmails } from '@/app/actions/practitionerActions'; 
import { OrganizationNode } from "@/types/global";

 // We'll use this for the live search

import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);
const countryOptions = Object.entries(countries.getNames('en', { select: 'official' }));


// =====================================================================
//                          Shared Types & Constants
// =====================================================================

type FormProps = { 
    onClose: () => void;
    patient?: FhirPatient; // Optional for pre-filling
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleNhsChange = (value: string) => {
    setNhsNumber(value);
    setNhsValid(value.length === 0 || isValidNhsNumber(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.length === 0) {
        addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        const result = await createPatient(
            { firstName, lastName, dob, gender, nhsNumber, mrn, phone, addressLine, city, postalCode, country },
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
        addToast({ title: 'Error', description: 'An error occurred. Please try logging in again.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold text-gray-900">Create New Patient</h2></div>
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Personal Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div><label htmlFor="firstName" className="form-label">First Name *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="firstName" className="form-input" required /></div>
          <div><label htmlFor="lastName" className="form-label">Last Name *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="lastName" className="form-input" required /></div>
          <div><label htmlFor="dob" className="form-label">Date of Birth *</label><input type="date" value={dob} onChange={(e) => setDob(e.target.value)} id="dob" className="form-input" required /></div>
          <div><label htmlFor="gender" className="form-label">Gender</label><select value={gender} onChange={(e) => setGender(e.target.value)} id="gender" className="form-input"><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Identifiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div><label htmlFor="nhsNumber" className="form-label">NHS Number</label><input type="text" value={nhsNumber} onChange={(e) => handleNhsChange(e.target.value)} id="nhsNumber" placeholder="e.g., 123 456 7890" className={`form-input ${nhsNumber && !nhsValid ? 'border-red-500' : ''}`} />{nhsNumber && !nhsValid && (<p className="text-sm text-red-600 mt-1">Invalid NHS number format</p>)}</div>
          <div><label htmlFor="mrn" className="form-label">Medical Record Number (MRN)</label><input type="text" value={mrn} onChange={(e) => setMrn(e.target.value)} id="mrn" placeholder="e.g., STJ-A-54321" className="form-input" /></div>
        </div>
      </div>
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Contact & Address</h3>
        <div><label htmlFor="phone" className="form-label">Phone Number *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} id="phone" className="form-input" required /></div>
        <div><label htmlFor="addressLine" className="form-label">Address Line 1</label><input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} id="addressLine" className="form-input" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div><label htmlFor="city" className="form-label">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} id="city" className="form-input" /></div>
          <div><label htmlFor="postalCode" className="form-label">Postal Code</label><input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} id="postalCode" className="form-input" /></div>
          <div><label htmlFor="country" className="form-label">Country</label><select value={country} onChange={(e) => setCountry(e.target.value)} id="country" className="form-input">{countryOptions.map(([code, name]) => (<option key={code} value={code}>{name}</option>))}</select></div>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Patient'}</button>
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(null);
  const [relationship, setRelationship] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      addToast({ title: 'Error', description: 'You must select a patient.', variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
      addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        const relationshipSelect = e.currentTarget.elements.namedItem("relationship") as HTMLSelectElement;
        const relationshipDisplay = relationshipSelect.options[relationshipSelect.selectedIndex].text;
        const result = await createCarer(
            { firstName, lastName, dob, phone, gender, patientId: selectedPatient.id, relationship, patientName: patientSearchTerm, relationshipDisplay },
            tokenResponse.accessToken
        );
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
          <div><label htmlFor="relationship" className="form-label">Relationship to Patient</label><select id="relationship" name="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="form-input"><option value="">Select relationship</option><option value="SPS">Spouse</option><option value="PRN">Parent</option><option value="CHD">Child</option><option value="OTH">Other</option></select></div>
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
//                        Create Assessment Form
// =====================================================================
export const CreateAssessmentForm: React.FC<FormProps> = ({ onClose, patient: preselectedPatient }) => {
  const { addToast } = useToast();
  const { instance, accounts } = useMsal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentType, setAssessmentType] = useState('');
  const [performerType, setPerformerType] = useState('Patient');
  const [performerName, setPerformerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taskBlocks, setTaskBlocks] = useState<TaskBlock[]>([]);
  const [openBlockIds, setOpenBlockIds] = useState<string[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(preselectedPatient || null);

  useEffect(() => {
    if (preselectedPatient) {
      const name = preselectedPatient.name?.[0];
      const displayName = name ? `${name.given.join(' ')} ${name.family}` : preselectedPatient.id;
      setPatientSearchTerm(displayName);
      setSelectedPatient(preselectedPatient);
    }
  }, [preselectedPatient]);

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
  };

  useEffect(() => {
    if (assessmentType === 'Standard Home Safety Check') {
      const generatedBlocks = homeSafetyTaskTemplate.map(block => ({ ...block, id: crypto.randomUUID(), subTasks: block.subTasks.map(subTask => ({ ...subTask, id: crypto.randomUUID() })) }));
      setTaskBlocks(generatedBlocks);
      setOpenBlockIds(generatedBlocks.map(b => b.id));
    } else {
      setTaskBlocks([]);
    }
  }, [assessmentType]);

  const toggleBlock = (blockId: string) => setOpenBlockIds(prev => prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]);
  const addTaskBlock = () => { const newBlockId = crypto.randomUUID(); setTaskBlocks(prev => [...prev, { id: newBlockId, title: '', subTasks: [] }]); setOpenBlockIds(prev => [...prev, newBlockId]); };
  const addSubTask = (blockId: string) => setTaskBlocks(prev => prev.map(block => block.id === blockId ? { ...block, subTasks: [...block.subTasks, { id: crypto.randomUUID(), description: '', type: 'custom', notes: '' }] } : block));
  const handleBlockTitleChange = (blockId: string, title: string) => setTaskBlocks(prev => prev.map(block => block.id === blockId ? { ...block, title } : block));
  const handleSubTaskDescriptionChange = (blockId: string, subTaskId: string, description: string) => setTaskBlocks(prev => prev.map(block => block.id === blockId ? { ...block, subTasks: block.subTasks.map(sub => sub.id === subTaskId ? { ...sub, description } : sub) } : block));
  const handleNoteChange = (blockId: string, subTaskId: string, notes: string) => setTaskBlocks(prev => prev.map(block => block.id === blockId ? { ...block, subTasks: block.subTasks.map(sub => sub.id === subTaskId ? { ...sub, notes } : sub) } : block));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      addToast({ title: 'Error', description: 'You must select a patient.', variant: 'destructive' });
      return;
    }
    if (accounts.length === 0) {
      addToast({ title: 'Auth Error', description: 'No user signed in.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
        const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
        const assessmentData = {
          serviceRequest: { patient: selectedPatient.id, assessmentType, performerType, performerName, startDate, endDate },
          tasks: taskBlocks.flatMap(block => block.subTasks.map(sub => ({
            description: sub.description,
            type: sub.type,
            notes: sub.notes,
            blockTitle: block.title 
          }))),
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
            <div><label className="form-label">Performer Type</label><select className="form-input" value={performerType} onChange={(e) => setPerformerType(e.target.value)}><option>Patient</option><option>Carer</option></select></div>
            <div><label className="form-label">Performer Name</label><input type="text" placeholder="Enter performer's name" className="form-input" value={performerName} onChange={(e) => setPerformerName(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div><label className="form-label">Start Date</label><input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="form-label">End Date</label><input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
      </div>
      {taskBlocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Assessment Tasks</h3>
          {taskBlocks.map(block => { 
            const isOpen = openBlockIds.includes(block.id); 
            return (
              <div key={block.id} className="bg-gray-50 rounded-lg border">
                <button type="button" onClick={() => toggleBlock(block.id)} className="w-full flex justify-between items-center p-4">
                  <input type="text" value={block.title} onChange={(e) => handleBlockTitleChange(block.id, e.target.value)} placeholder="Enter block name..." onClick={(e) => e.stopPropagation()} className="font-bold text-md text-gray-800 bg-transparent flex-grow p-1 -m-1 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded" />
                  <ChevronDown className={`transition-transform transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
                    {block.subTasks.map(subTask => (
                      <div key={subTask.id} className="p-3 bg-white rounded-md border">
                        <input type="text" value={subTask.description} onChange={(e) => handleSubTaskDescriptionChange(block.id, subTask.id, e.target.value)} placeholder="Enter subtask name..." className="font-semibold text-sm w-full p-1 -m-1 focus:bg-gray-50 focus:ring-1 focus:ring-blue-500 rounded" />
                        <textarea className="form-input mt-2 w-full text-sm" placeholder="Add additional notes for this task..." value={subTask.notes} onChange={(e) => handleNoteChange(block.id, subTask.id, e.target.value)} />
                      </div>
                    ))}
                     <button type="button" onClick={() => addSubTask(block.id)} className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center mt-2">
                       <Plus size={16} className="mr-1" /> Add Subtask
                     </button>
                  </div>
                )}
              </div>
            ); 
          })}
        </div>
      )}
      <button type="button" onClick={addTaskBlock} className="w-full btn-secondary">+ Add New Task Block</button>
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
  const { instance, accounts } = useMsal();
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
      if (accounts.length > 0) {
        setIsLoadingData(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const { tree, existingIds, existingNames } = await getOrganizationTree(tokenResponse.accessToken);
          setOrganizationTree(tree);
          setExistingOrgIds(existingIds);
          setExistingOrgNames(existingNames.map(n => n.toLowerCase()));
        } catch (error) {
          addToast({ title: 'Error', description: 'Could not load organizations.', variant: 'destructive' });
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    loadOrgData();
  }, [accounts, instance, addToast]);

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
      addToast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
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
            <option value="">None (Top-Level Organization)</option>
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