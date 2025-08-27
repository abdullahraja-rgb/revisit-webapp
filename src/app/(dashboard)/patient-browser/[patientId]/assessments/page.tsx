"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAssessmentsForPatient } from '@/app/actions/assessmentActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';
import { FhirServiceRequest } from '@/types/global';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Loader, Inbox, FileText, ChevronDown, ChevronUp, Camera, X } from 'lucide-react';

type EnrichedAssessment = FhirServiceRequest & {
  observations?: any[];
};

export default function AssessmentsPage({ patient }: { patient: any }) {
  const router = useRouter();
  const params = useParams();
  const { instance, accounts } = useMsal();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const [assessments, setAssessments] = useState<EnrichedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [isGeneratingUrl, setIsGeneratingUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  useEffect(() => {
    const loadAssessments = async () => {
      if (patientId && accounts.length > 0) {
        setIsLoading(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const bundle = await getAssessmentsForPatient(patientId, tokenResponse.accessToken);

          if (bundle && bundle.entry) {
            // Separate all resource types from the bundle
            const allAssessments: FhirServiceRequest[] = [];
            const allObservations: any[] = [];
            const allDocRefs: any[] = [];

            bundle.entry.forEach((entry: any) => {
              const resource = entry.resource;
              if (resource) {
                if (resource.resourceType === 'ServiceRequest') allAssessments.push(resource);
                else if (resource.resourceType === 'Observation') allObservations.push(resource);
                else if (resource.resourceType === 'DocumentReference') allDocRefs.push(resource);
              }
            });

            console.log("%c--- Verifying Links for Assessment Observations ---", "color: purple; font-weight: bold;");
            const linkReport = allObservations.map(observation => {
              const docRef = allDocRefs.find(doc =>
                observation.derivedFrom?.some((ref: any) => ref.reference?.endsWith(doc.id))
              );
              return {
                observationId: observation.id,
                mediaUrl: docRef?.content?.[0]?.attachment?.url || "--- URL NOT FOUND ---"
              };
            });
            console.table(linkReport);

            // Enrich observations with their document content for easier access
            const enrichedObservations = allObservations.map(obs => {
              const docRef = allDocRefs.find(doc =>
                obs.derivedFrom?.some((ref: any) => ref.reference?.endsWith(doc.id))
              );
              return {
                ...obs,
                documentContent: docRef?.content?.[0] 
              };
            });

            // Link the enriched observations back to their parent assessment
            const enrichedAssessments = allAssessments.map(assessment => ({
              ...assessment,
              observations: enrichedObservations.filter(
                obs => obs.basedOn?.[0]?.reference === `ServiceRequest/${assessment.id}`
              ),
            }));

            setAssessments(enrichedAssessments);
          }
        } catch (error) { console.error("Failed to load assessments:", error); }
        finally { setIsLoading(false); }
      } else { setIsLoading(false); }
    };
    loadAssessments();
  }, [patientId, accounts, instance]);
  
  const handleToggle = (id: string) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };
  
  const handleViewMedia = async (observation: any) => {
    setIsGeneratingUrl(observation.id);
    try {
      const attachment = observation.documentContent?.attachment;
      if (!attachment?.url) {
        alert("Media URL not found for this observation. Please check the console for details.");
        return;
      }
      
      const blobUrl = attachment.url;
      const contentType = attachment.contentType || '';
      const blobName = blobUrl.split('/revisit-uploads/')[1];

      if (!blobName) {
        alert("Could not determine the file name from the URL.");
        return;
      }

      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const secureUrl = await generateSecureModelUrl(blobName, tokenResponse.accessToken);

      if (!secureUrl) {
        alert("Failed to get a secure link for the media.");
        return;
      }

    if (contentType.startsWith('image/')) {
      setModalContent({ url: secureUrl, type: 'image' });
      setIsModalOpen(true);
    } else if (contentType.startsWith('video/')) {
      setModalContent({ url: secureUrl, type: 'video' });
      setIsModalOpen(true);
    } else if (contentType.startsWith('model/')) { // trating a 3d model differently
      const modelName = observation.code?.text || '3D Model';
      // Safely get the patient's name from the prop
      const patientName = patient?.name?.[0]?.given?.[0] || 'Patient';
      const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=${encodeURIComponent(patientName)}&modelName=${encodeURIComponent(modelName)}`;
      router.push(workspaceUrl); 
    } else {
      // Fallback for other file types like PDF
      window.open(secureUrl, '_blank');
    }
    } catch (error) {
      console.error("Failed to generate secure media URL:", error);
      alert("An error occurred while trying to view the media.");
    } finally {
      setIsGeneratingUrl(null);
    }
  };
  
  const renderMediaModal = () => {
    if (!isModalOpen || !modalContent) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={() => setIsModalOpen(false)}>
        <div className="bg-white p-4 rounded-lg shadow-xl relative max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setIsModalOpen(false)} className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-black hover:bg-neutral-200"><X className="w-6 h-6" /></button>
          {modalContent.type === 'image' && <img src={modalContent.url} alt="Observation content" className="max-w-full max-h-[75vh] object-contain" />}
          {modalContent.type === 'video' && <video src={modalContent.url} controls autoPlay className="max-w-full max-h-[75vh]">Your browser does not support the video tag.</video>}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (<div className="flex justify-center items-center p-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Assessments</h3>
            <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{assessments.length} total</span>
        </div>
        {assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.map(assessment => {
                const isExpanded = expandedId === assessment.id;
                const hasObservations = (assessment.observations?.length ?? 0) > 0;
                return (
                    <div key={assessment.id} className="bg-neutral-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between w-full">
                           <div className="flex items-center">
                                <div className="bg-neutral-200 p-3 rounded-full mr-4">
                                    <FileText className="w-5 h-5 text-neutral-600"/>
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-800">{assessment.code?.text || 'Assessment'}</p>
                                    <p className="text-sm text-neutral-500">Created on: {new Date(assessment.authoredOn!).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${assessment.status === 'completed' ? 'bg-success-light text-success' : 'bg-blue-100 text-primary'}`}>{assessment.status}</span>
                              {hasObservations && (
                                <button onClick={() => handleToggle(assessment.id!)} className="p-1 rounded-full hover:bg-neutral-200">{isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-600" /> : <ChevronDown className="w-5 h-5 text-neutral-600" />}</button>
                              )}
                            </div>
                        </div>

                        {isExpanded && hasObservations && (
                          <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                            <h4 className="text-sm font-semibold text-neutral-700">Observations ({assessment.observations?.length})</h4>
                            {assessment.observations?.map((obs, index) => (
                              <div key={index} className="flex items-center bg-white p-3 rounded-md border">
                                <div className="bg-blue-100 p-2 rounded-full mr-3"><Camera className="w-5 h-5 text-primary"/></div>
                                <div className="flex-1">
                                  <p className="text-sm text-neutral-800 font-medium">{obs.code?.text || 'No description'}</p>
                                </div>
                                <button onClick={() => handleViewMedia(obs)} className="btn btn-secondary text-sm w-20 text-center" disabled={isGeneratingUrl === obs.id}>
                                  {isGeneratingUrl === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'View'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                );
              })}
            </div>
        ) : (
            <div className="text-center p-8 text-neutral-500 bg-neutral-50 rounded-lg"><Inbox className="w-10 h-10 mx-auto text-neutral-400" /><p className="mt-2 font-medium">No assessments found for this patient.</p></div>
        )}
        {renderMediaModal()}
    </div>
  );
}