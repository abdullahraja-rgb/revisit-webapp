"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FhirPatient, FhirObservation, FhirDocumentReference } from '@/types/global';
import { getObservationsForPatient } from '@/app/actions/observationActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';
import { Camera, Video, Box, Loader } from 'lucide-react';

type PatientProfileModalProps = {
  patient: FhirPatient;
  onCreateAssessment: (patient: FhirPatient) => void;
};

const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ patient, onCreateAssessment }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Observations' | 'Assessments'>('Observations');
  const router = useRouter();

  // State for holding fetched data
  const [observations, setObservations] = useState<FhirObservation[]>([]);
  const [docReferences, setDocReferences] = useState<FhirDocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState<string | null>(null); // Track which button is loading

  // Effect to fetch data when the modal opens or the patient changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const bundle = await getObservationsForPatient(patient.id);
      
      if (bundle && bundle.entry) {
        // Separate the observations and document references from the bundle
        const obs = bundle.entry
          .filter((e: any) => e.resource.resourceType === 'Observation')
          .map((e: any) => e.resource);
        
        const docs = bundle.entry
          .filter((e: any) => e.resource.resourceType === 'DocumentReference')
          .map((e: any) => e.resource);
          
        setObservations(obs);
        setDocReferences(docs);
      }
      setIsLoading(false);
    };
    
    loadData();
  }, [patient.id]);

  const handleViewModel = async (observation: FhirObservation) => {
    setIsGeneratingUrl(observation.id);

    // Find the DocumentReference linked to this observation via the `derivedFrom` field.
    const docRef = docReferences.find(doc =>
        observation.derivedFrom?.some(ref => ref.reference === `DocumentReference/${doc.id}`)
    );

    if (!docRef || !docRef.content?.[0]?.attachment?.url) {
      alert("No document URL found for this observation.");
      setIsGeneratingUrl(null);
      return;
    }

    const blobUrl = docRef.content[0].attachment.url;
    // This should match your backend storage container name
    const containerName = "revisit-uploads"; 
    const blobName = blobUrl.split(`/${containerName}/`)[1];

    if (!blobName) {
        alert("Could not determine the file name from the URL.");
        setIsGeneratingUrl(null);
        return;
    }

    const secureUrl = await generateSecureModelUrl(blobName);

    if (secureUrl) {
      // Get the patient and model names to pass to the workspace page.
      const patientName = patient.name?.[0] ? `${patient.name[0].given.join(' ')} ${patient.name[0].family}` : 'Unknown Patient';
      const modelName = observation.code?.coding?.[0]?.display || '3D Model';

      // Construct the URL with all the necessary query parameters.
      const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=${encodeURIComponent(patientName)}&modelName=${encodeURIComponent(modelName)}`;
      
      router.push(workspaceUrl);
    } else {
      alert("Failed to get a secure link to view the model.");
    }
    
    setIsGeneratingUrl(null);
  };

  const patientName = patient.name?.[0];
  const nhsNumber = patient.identifier?.find(id => id.system.includes('nhs-number'))?.value;

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0 h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
          {patientName?.given[0]?.[0] || 'P'}
          {patientName?.family?.[0] || 'A'}
        </div>
        <div className="ml-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            {patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A'}
            <span className={`ml-3 text-xs font-medium px-2.5 py-1 rounded-full ${patient.active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {patient.active ? 'active' : 'pending'}
            </span>
          </h2>
          <p className="text-sm text-gray-500">NHS: {nhsNumber || 'N/A'}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setActiveTab('Overview')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Overview' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Overview</button>
          <button onClick={() => setActiveTab('Observations')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Observations' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Observations</button>
          <button onClick={() => setActiveTab('Assessments')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Assessments' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Assessments</button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Observations' && (
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Submitted Observations</h3>
                {!isLoading && <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{observations.length} total</span>}
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center p-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : observations.length > 0 ? (
                <div className="space-y-3">
                  {observations.map(obs => {
                    const description = obs.code.coding?.[0]?.display || 'Observation';
                    const isModel = description.toLowerCase().includes('3d model');
                    const isVideo = description.toLowerCase().includes('video');
                    const isImage = description.toLowerCase().includes('image');
                    
                    return (
                        <div key={obs.id} className="bg-white p-4 rounded-lg border grid grid-cols-6 gap-4 items-center">
                          <div className="col-span-1 flex items-center justify-center">
                            <div className="bg-gray-100 p-3 rounded-full">
                                {isModel ? <Box className="w-5 h-5 text-gray-600"/> : isVideo ? <Video className="w-5 h-5 text-gray-600"/> : isImage ? <Camera className="w-5 h-5 text-gray-600"/> : <Camera className="w-5 h-5 text-gray-600"/>}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <p className="font-semibold text-gray-800">{description}</p>
                            <p className="text-sm text-gray-600">{obs.note?.[0]?.text || 'No additional notes.'}</p>
                            <p className="text-xs text-gray-400 mt-1">Date: {new Date(obs.effectiveDateTime).toLocaleDateString()}</p>
                          </div>
                          <div className="col-span-1 text-center">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${obs.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{obs.status}</span>
                          </div>
                          <div className="col-span-1 text-right">
                            <button 
                              onClick={() => handleViewModel(obs)} 
                              className="btn-secondary text-sm w-20 text-center" 
                              disabled={isGeneratingUrl === obs.id}
                            >
                              {isGeneratingUrl === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto"/> : 'View'}
                            </button>
                          </div>
                        </div>
                    );
                  })}
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">No observations found for this patient.</div>
            )}
          </div>
        )}
        {activeTab === 'Overview' && <div className="text-center p-8 text-gray-500">Overview content goes here.</div>}
        {activeTab === 'Assessments' && <div className="text-center p-8 text-gray-500">Assessments list goes here.</div>}
      </div>
    </div>
  );
};

export default PatientProfileModal;