"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Loader } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createPatient } from '@/app/actions/patientActions';
import { createAssessmentAndTasks } from '@/app/actions/assessmentActions';
import { createCarer } from '@/app/actions/carerActions';
import { FhirPatient } from '@/types/global';
import { searchPatients } from '@/app/actions/patientSearchActions'; // We'll use this for the live search

import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);
const countryOptions = Object.entries(countries.getNames('en', { select: 'official' }));

// =====================================================================
//                          Shared Types & Constants
// =====================================================================

type FormProps = { onClose: () => void; };
type SubTask = { id: string; description: string; type: '3d model' | 'video' | 'image' | 'custom'; notes: string; };
type TaskBlock = { id: string; title: string; subTasks: SubTask[]; };
const homeSafetyTaskTemplate: Omit<TaskBlock, 'id'>[] = [
  { title: 'Kitchen', subTasks: [ /* ... */ ] },
  { title: 'Living Room', subTasks: [ /* ... */ ] },
  { title: 'Bathroom', subTasks: [ /* ... */ ] },
];

function isValidNhsNumber(nhsNumber: string): boolean {
  const sanitized = nhsNumber.replace(/\s/g, '');
  if (!/^\d{10}$/.test(sanitized)) {
    return false; // Must be 10 digits
  }

  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += parseInt(sanitized[i], 10) * (10 - i);
  }

  const remainder = total % 11;
  const checkDigit = 11 - remainder;

  if (checkDigit === 11) {
    return parseInt(sanitized[9], 10) === 0;
  }
  if (checkDigit === 10) {
    return false; // 10 is not a valid check digit
  }

  return checkDigit === parseInt(sanitized[9], 10);
}


// =====================================================================
//                          Create Patient Form
// =====================================================================
export const CreatePatientForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for all form fields
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

  // NHS validation state
  const [nhsValid, setNhsValid] = useState(true);

  const handleNhsChange = (value: string) => {
    setNhsNumber(value);
    const sanitized = value.replace(/\s/g, '');
    setNhsValid(sanitized.length === 0 || isValidNhsNumber(sanitized));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await createPatient({
      firstName, lastName, dob, gender, nhsNumber, mrn, phone, addressLine, city, postalCode, country
    });

    if (result.success) {
      addToast({ title: 'Success', description: result.message });
      onClose();
    } else {
      addToast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Patient</h2>
      </div>

      {/* Personal Details Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Personal Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="form-label">First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="firstName" className="form-input" required />
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="lastName" className="form-input" required />
          </div>
          <div>
            <label htmlFor="dob" className="form-label">Date of Birth *</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} id="dob" className="form-input" required />
          </div>
          <div>
            <label htmlFor="gender" className="form-label">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} id="gender" className="form-input">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Identifiers Section */}
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
            <input type="text" value={mrn} onChange={(e) => setMrn(e.target.value)} id="mrn" placeholder="e.g., STJ-A-54321" className="form-input" />
          </div>
        </div>
      </div>

      {/* Contact & Address Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Contact & Address</h3>
        <div>
          <label htmlFor="phone" className="form-label">Phone Number *</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} id="phone" className="form-input" required />
        </div>
        <div>
          <label htmlFor="addressLine" className="form-label">Address Line 1</label>
          <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} id="addressLine" className="form-input" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="city" className="form-label">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} id="city" className="form-input" />
          </div>
          <div>
            <label htmlFor="postalCode" className="form-label">Postal Code</label>
            <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} id="postalCode" className="form-input" />
          </div>
          <div>
            <label htmlFor="country" className="form-label">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} id="country" className="form-input">
              {countryOptions.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for carer form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState(''); // Added state for gender
  
  // State for the live patient search
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  const [relationship, setRelationship] = useState('');

  // Debounced search effect
  useEffect(() => {
    if (!patientSearchTerm.trim()) {
      setPatientSearchResults([]);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsPatientSearching(true);
      const results = await searchPatients(patientSearchTerm);
      setPatientSearchResults(results);
      setIsPatientSearching(false);
    }, 300);
    return () => clearTimeout(timerId);
  }, [patientSearchTerm]);

  const handlePatientSelect = (patient: FhirPatient) => {
    const patientName = patient.name?.[0];
    const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
    setPatientSearchTerm(displayName);
    setSelectedPatientId(patient.id);
    setPatientSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
        addToast({ title: 'Error', description: 'You must select a patient from the search results.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    
    const relationshipSelect = e.currentTarget.elements.namedItem("relationship") as HTMLSelectElement;
    const relationshipDisplay = relationshipSelect.options[relationshipSelect.selectedIndex].text;

    // --- UPDATED: Pass all the new fields to the server action ---
    const result = await createCarer({
        firstName,
        lastName,
        dob, // Added dob
        phone, // Added phone
        gender, // Added gender
        patientId: selectedPatientId,
        relationship,
        patientName: patientSearchTerm,
        relationshipDisplay
    });

    if (result.success) {
        addToast({ title: 'Success', description: result.message });
        onClose();
    } else {
        addToast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Carer</h2>
      </div>

      {/* Carer Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Carer Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="carerFirstName" className="form-label">First Name *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} id="carerFirstName" className="form-input" required />
            </div>
            <div>
                <label htmlFor="carerLastName" className="form-label">Last Name *</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} id="carerLastName" className="form-input" required />
            </div>
            <div>
                <label htmlFor="carerDob" className="form-label">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} id="carerDob" className="form-input" />
            </div>
            {/* --- NEW: Gender Input --- */}
            <div>
                <label htmlFor="carerGender" className="form-label">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} id="carerGender" className="form-input">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="carerPhone" className="form-label">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} id="carerPhone" placeholder="e.g., 07700 900123" className="form-input" />
            </div>
        </div>
      </div>
      
      {/* Care Relationship Section */}
       <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Care Relationship</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="sm:col-span-2 relative">
            <label htmlFor="patientSearch" className="form-label">Cares for Patient *</label>
            <div className="relative">
              <input
                type="text"
                id="patientSearch"
                placeholder="Start typing to search for a patient..."
                className="form-input"
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                autoComplete="off"
                required
              />
              {isPatientSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
            </div>
            
            {patientSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {patientSearchResults.map(patient => {
                        const patientName = patient.name?.[0];
                        const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
                        return (
                            <div 
                                key={patient.id} 
                                onClick={() => handlePatientSelect(patient)}
                                className="px-4 py-2 hover:bg-primary-light cursor-pointer"
                            >
                                <p className="font-medium text-neutral-800">{displayName}</p>
                                <p className="text-xs text-neutral-500">ID: {patient.id}</p>
                            </div>
                        )
                    })}
                </div>
            )}
           </div>
           
           <div>
            <label htmlFor="relationship" className="form-label">Relationship to Patient</label>
            <select id="relationship" name="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="form-input">
              <option value="">Select relationship</option>
              <option value="SPS">Spouse</option>
              <option value="PRN">Parent</option>
              <option value="CHD">Child</option>
              <option value="OTH">Other</option>
            </select>
           </div>
         </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Carer'}
        </button>
      </div>
    </form>
  );
};


// =====================================================================
//                        Create Assessment Form
// =====================================================================
export const CreateAssessmentForm: React.FC<FormProps> = ({ onClose, patient: preselectedPatient }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [assessmentType, setAssessmentType] = useState('');
  const [performerType, setPerformerType] = useState('Patient');
  const [performerName, setPerformerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taskBlocks, setTaskBlocks] = useState<TaskBlock[]>([]);
  const [openBlockIds, setOpenBlockIds] = useState<string[]>([]);

  // --- State for the live patient search ---
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<FhirPatient[]>([]);
  const [isPatientSearching, setIsPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<FhirPatient | null>(preselectedPatient || null);

  // Effect to pre-fill patient info if provided
  useEffect(() => {
    if (preselectedPatient) {
      const name = preselectedPatient.name?.[0];
      const displayName = name ? `${name.given.join(' ')} ${name.family}` : preselectedPatient.id;
      setPatientSearchTerm(displayName);
      setSelectedPatient(preselectedPatient);
    }
  }, [preselectedPatient]);

  // Debounced search effect
  useEffect(() => {
    // Don't search if a patient is already selected from a previous action
    if (preselectedPatient || !patientSearchTerm.trim()) {
      setPatientSearchResults([]);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsPatientSearching(true);
      const results = await searchPatients(patientSearchTerm);
      setPatientSearchResults(results);
      setIsPatientSearching(false);
    }, 300);
    return () => clearTimeout(timerId);
  }, [patientSearchTerm, preselectedPatient]);

  const handlePatientSelect = (patient: FhirPatient) => {
    const patientName = patient.name?.[0];
    const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
    setPatientSearchTerm(displayName);
    setSelectedPatient(patient);
    setPatientSearchResults([]);
  };

  // Effect to generate tasks when "Standard Home Safety Check" is selected
  useEffect(() => {
    if (assessmentType === 'Standard Home Safety Check') {
      const generatedBlocks = homeSafetyTaskTemplate.map(block => ({ ...block, id: crypto.randomUUID(), subTasks: block.subTasks.map(subTask => ({ ...subTask, id: crypto.randomUUID() })) }));
      setTaskBlocks(generatedBlocks);
      setOpenBlockIds(generatedBlocks.map(b => b.id));
    } else {
      setTaskBlocks([]);
    }
  }, [assessmentType]);

  // --- Handler Functions for tasks (remain the same) ---
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
    setIsSubmitting(true);
    
    const assessmentData = {
      serviceRequest: { patient: selectedPatient.id, assessmentType, performerType, performerName, startDate, endDate },
      tasks: taskBlocks.flatMap(block => block.subTasks.map(sub => ({
        description: sub.description,
        type: sub.type,
        notes: sub.notes,
        blockTitle: block.title 
      }))),
    };

    const result = await createAssessmentAndTasks(assessmentData);
    if (result.success) {
      addToast({ title: 'Success', description: result.message });
      onClose();
    } else {
      addToast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
      <div><h2 className="text-2xl font-bold text-gray-900">Create New Assessment</h2></div>
      
      <div className="space-y-6">
        <div className="relative">
            <label className="form-label">Patient *</label>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search patient by name or DOB" 
                    className="form-input" 
                    value={patientSearchTerm} 
                    onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        if (selectedPatient) setSelectedPatient(null); // Clear selection if user types again
                    }} 
                    required 
                    disabled={!!preselectedPatient} 
                    autoComplete="off"
                />
                {isPatientSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
            </div>
            {patientSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {patientSearchResults.map(patient => {
                        const patientName = patient.name?.[0];
                        const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : patient.id;
                        return (
                            <div key={patient.id} onClick={() => handlePatientSelect(patient)} className="px-4 py-2 hover:bg-primary-light cursor-pointer">
                                <p className="font-medium text-neutral-800">{displayName}</p>
                                <p className="text-xs text-neutral-500">ID: {patient.id}</p>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
        <div>
            <label className="form-label">Type of Assessment *</label>
            <select className="form-input" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)} required>
                <option value="">Select type</option>
                <option>Standard Home Safety Check</option>
                <option>Follow-up Assessment</option>
                <option>Initial Consultation</option>
            </select>
        </div>
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



// Define the props for the form
type FormProps = {
  onClose: () => void;
};

export const CreatePractitionerForm: React.FC<FormProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // This is where you would call your server action to send the data to the backend
    console.log("Submitting new practitioner:", { firstName, lastName, email, tenantId });
    // const result = await createPractitioner({ firstName, lastName, email, tenantId });

    // Simulate success for now
    addToast({ title: 'Success (Simulated)', description: 'Practitioner invitation would be sent.' });
    onClose();
    
    setIsSubmitting(false);
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
        </div>
        <div>
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              id="email" 
              placeholder="practitioner@hospital.com" 
              className="form-input" 
              required 
            />
        </div>
        <div>
            <label htmlFor="tenantId" className="form-label">Organization (Tenant ID) *</label>
            <input 
              type="text" 
              value={tenantId} 
              onChange={(e) => setTenantId(e.target.value)} 
              id="tenantId" 
              placeholder="e.g., leeds-teaching-hospitals-nhs-trust" 
              className="form-input" 
              required 
            />
        </div>
      </div>

      <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Sending Invitation...' : 'Create & Invite Practitioner'}
        </button>
      </div>
    </form>
  );
};