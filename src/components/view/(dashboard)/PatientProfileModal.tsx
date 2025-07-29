"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FhirPatient, FhirObservation, FhirDocumentReference } from '@/types/global';
import { getObservationsForPatient } from '@/app/actions/observationActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Camera, Video, Box, Loader, User, Cake, Phone, Home as HomeIcon, Hash } from 'lucide-react';

type PatientProfileModalProps = {
  patient: FhirPatient;
  onCreateAssessment: (patient: FhirPatient) => void;
};

// The OverviewTab component remains the same
const OverviewTab = ({ patient }: { patient: FhirPatient }) => {
    const patientName = patient.name?.[0];
    const address = patient.address?.[0];
    const phone = patient.telecom?.find(t => t.system === 'phone')?.value;
    const nhsNumber = patient.identifier?.find(id => id.system.includes('nhs-number'))?.value;
    const mrn = patient.identifier?.find(id => id.type?.text === 'Medical Record Number')?.value;

    const calculateAge = (birthDate: string | undefined) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | undefined }) => (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-6 mt-1 text-neutral-400">{icon}</div>
            <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="font-medium text-neutral-900">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-2">
            <DetailItem icon={<User size={20} />} label="Full Name" value={patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A'} />
            <DetailItem icon={<Cake size={20} />} label="Date of Birth" value={`${patient.birthDate} (${calculateAge(patient.birthDate)} years)`} />
            <DetailItem icon={<Hash size={20} />} label="NHS Number" value={nhsNumber} />
            <DetailItem icon={<Hash size={20} />} label="Medical Record Number" value={mrn} />
            <DetailItem icon={<Phone size={20} />} label="Phone" value={phone} />
            <DetailItem icon={<HomeIcon size={20} />} label="Address" value={address ? `${address.line?.[0]}, ${address.city}, ${address.postalCode}` : 'N/A'} />
        </div>
    );
};


const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ patient, onCreateAssessment }) => {
  const router = useRouter();
  const { instance, accounts } = useMsal(); // Get the MSAL instance
  const [activeTab, setActiveTab] = useState<'Overview' | 'Observations' | 'Assessments'>('Overview');
  const [observations, setObservations] = useState<FhirObservation[]>([]);
  const [docReferences, setDocReferences] = useState<FhirDocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'Observations' && observations.length === 0 && accounts.length > 0) {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
                const bundle = await getObservationsForPatient(patient.id, tokenResponse.accessToken);
                if (bundle && bundle.entry) {
                    const obs = bundle.entry.filter((e: any) => e.resource.resourceType === 'Observation').map((e: any) => e.resource);
                    const docs = bundle.entry.filter((e: any) => e.resource.resourceType === 'DocumentReference').map((e: any) => e.resource);
                    setObservations(obs);
                    setDocReferences(docs);
                }
            } catch (error) {
                console.error("Failed to load observations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }
  }, [patient.id, activeTab, observations.length, accounts, instance]);

  const handleViewModel = async (observation: FhirObservation) => {
    setIsGeneratingUrl(observation.id);
    
    if (accounts.length === 0) {
        alert("Authentication error. Please log in again.");
        setIsGeneratingUrl(null);
        return;
    }

    const docRef = docReferences.find(doc => observation.derivedFrom?.some(ref => ref.reference === `DocumentReference/${doc.id}`));
    if (!docRef || !docRef.content?.[0]?.attachment?.url) {
      alert("No document URL found for this observation.");
      setIsGeneratingUrl(null);
      return;
    }

    const blobUrl = docRef.content[0].attachment.url;
    const containerName = "revisit-uploads"; 
    const blobName = blobUrl.split(`/${containerName}/`)[1];
    if (!blobName) {
        alert("Could not determine the file name from the URL.");
        setIsGeneratingUrl(null);
        return;
    }
    
    try {
        // --- THIS IS THE FIX ---
        // 1. Acquire a token before calling the action
        const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
        });

        // 2. Pass the real token to the server action
        const secureUrl = await generateSecureModelUrl(blobName, tokenResponse.accessToken);

        if (secureUrl) {
          const patientName = patient.name?.[0] ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient';
          const modelName = observation.code?.coding?.[0]?.display || '3D Model';
          const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=${encodeURIComponent(patientName)}&modelName=${encodeURIComponent(modelName)}`;
          router.push(workspaceUrl);
        } else {
          alert("Failed to get a secure link to view the model.");
        }
    } catch (error) {
        console.error("Failed to acquire token for SAS URL:", error);
        alert("Could not get permission to view the model. Please try logging in again.");
    } finally {
        setIsGeneratingUrl(null);
    }
  };

  const patientName = patient.name?.[0];
  const nhsNumber = patient.identifier?.find(id => id.system.includes('nhs-number'))?.value;

  return (
    <div className="w-full">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-primary-light text-primary flex items-center justify-center text-xl font-bold">
          {patientName?.given?.[0]?.[0] || 'P'}{patientName?.family?.[0] || 'A'}
        </div>
        <div className="ml-4">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center">
            {patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A'}
            <span className={`ml-3 text-xs font-medium px-2.5 py-1 rounded-full ${patient.active ? 'bg-success-light text-success' : 'bg-warning-light text-warning-dark'}`}>{patient.active ? 'active' : 'pending'}</span>
          </h2>
          <p className="text-sm text-neutral-500">NHS: {nhsNumber || 'N/A'}</p>
        </div>
      </div>

      <div className="border-b border-neutral-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setActiveTab('Overview')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Overview' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>Overview</button>
          <button onClick={() => setActiveTab('Observations')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Observations' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>Observations</button>
          <button onClick={() => setActiveTab('Assessments')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Assessments' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>Assessments</button>
        </nav>
      </div>

      <div>
        {activeTab === 'Overview' && <OverviewTab patient={patient} />}
        {activeTab === 'Observations' && (
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-neutral-800">Submitted Observations</h3>
                {!isLoading && <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{observations.length} total</span>}
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center p-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>
            ) : observations.length > 0 ? (
                <div className="space-y-3">
                  {observations.map(obs => {
                    const description = obs.code.coding?.[0]?.display || 'Observation';
                    const isModel = description.toLowerCase().includes('3d model');
                    const isVideo = description.toLowerCase().includes('video');
                    const isImage = description.toLowerCase().includes('image');
                    return (
                        <div key={obs.id} className="bg-white p-4 rounded-lg border grid grid-cols-6 gap-4 items-center">
                          <div className="col-span-1 flex items-center justify-center"><div className="bg-neutral-100 p-3 rounded-full">{isModel ? <Box className="w-5 h-5 text-neutral-600"/> : isVideo ? <Video className="w-5 h-5 text-neutral-600"/> : <Camera className="w-5 h-5 text-neutral-600"/>}</div></div>
                          <div className="col-span-3"><p className="font-semibold text-neutral-800">{description}</p><p className="text-sm text-neutral-600">{obs.note?.[0]?.text || 'No additional notes.'}</p><p className="text-xs text-neutral-400 mt-1">Date: {new Date(obs.effectiveDateTime).toLocaleDateString()}</p></div>
                          <div className="col-span-1 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${obs.status === 'final' ? 'bg-success-light text-success' : 'bg-warning-light text-warning-dark'}`}>{obs.status}</span></div>
                          <div className="col-span-1 text-right"><button onClick={() => handleViewModel(obs)} className="btn btn-secondary text-sm w-20 text-center" disabled={isGeneratingUrl === obs.id}>{isGeneratingUrl === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto"/> : 'View'}</button></div>
                        </div>
                    );
                  })}
                </div>
            ) : (
                <div className="text-center p-8 text-neutral-500 bg-neutral-50 rounded-lg">No observations found for this patient.</div>
            )}
          </div>
        )}
        {activeTab === 'Assessments' && <div className="text-center p-8 text-neutral-500">Assessments list goes here.</div>}
      </div>
    </div>
  );
};

export default PatientProfileModal;