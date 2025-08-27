"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { useDashboardModal } from '@/app/(dashboard)/layout';


import { getAssessments, setObservationViewedStatus, completeAssessment } from '@/app/actions/monitoringActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';

import { FhirServiceRequest, FhirTask, FhirObservation, FhirDocumentReference } from '@/types/global';
import { Loader, CheckCircle, Clock, Inbox, FileText, X, Camera } from 'lucide-react';

type ProcessedAssessment = {
  serviceRequest: FhirServiceRequest;
  tasks: FhirTask[];
  observations: any[]; // Using 'any' for enriched observations with 'documentContent'
  documentReferences: FhirDocumentReference[];
};


// ============================================================================
//  SUB-COMPONENT: AssessmentCard
// ============================================================================
const AssessmentCard = ({ assessment, onClick }: { assessment: ProcessedAssessment, onClick: () => void }) => {
  const { serviceRequest, observations } = assessment;
  const patientName = serviceRequest.subject.display || `Patient/${serviceRequest.subject.reference.split('/')[1]}`;
  const assessmentType = serviceRequest.code?.text || 'Assessment';

  const totalObservations = observations.length;
  const viewedObservations = observations.filter(obs =>
    obs.meta?.tag?.some((tag: any) => tag.system === 'https://revisit.humant.com/workflow-status' && tag.code === 'viewed')
  ).length;
  const progress = totalObservations > 0 ? (viewedObservations / totalObservations) * 100 : 0;

  const getStatusInfo = () => {
    if (serviceRequest.status === 'completed') {
      return { text: 'Completed', icon: <CheckCircle className="w-4 h-4 text-green-600" />, color: 'bg-green-100 text-green-800' };
    }
    return { text: 'In Progress', icon: <Clock className="w-4 h-4 text-blue-600" />, color: 'bg-blue-100 text-blue-800' };
  };
  const statusInfo = getStatusInfo();

  return (
    <div onClick={onClick} className="bg-white p-5 rounded-lg border shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-lg text-gray-800">{assessmentType}</p>
          <p className="text-sm text-gray-500">For: {patientName}</p>
        </div>
        <div className={`flex items-center space-x-2 text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}>
          {statusInfo.icon}<span>{statusInfo.text}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Review Progress</span>
          <span className="font-medium">{viewedObservations} of {totalObservations} Viewed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};


// ============================================================================
//  SUB-COMPONENT: AssessmentDetailModal
// ============================================================================
const AssessmentDetailModal = ({ assessment, onClose, onUpdate }: { assessment: ProcessedAssessment, onClose: () => void, onUpdate: () => void }) => {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const totalObservations = assessment.observations.length;
  const viewedObservations = assessment.observations.filter(obs =>
    obs.meta?.tag?.some((tag: any) => tag.system === 'https://revisit.humant.com/workflow-status' && tag.code === 'viewed')
  ).length;
  const isReviewComplete = totalObservations > 0 && viewedObservations === totalObservations;

  const handleCheckboxChange = async (obsId: string, isChecked: boolean) => {
    setIsProcessing(obsId);
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      await setObservationViewedStatus(obsId, isChecked, tokenResponse.accessToken);
      onUpdate();
    } catch (error) {
      console.error("Failed to update checkbox status", error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCompleteAssessment = async () => {
    if (!isReviewComplete || assessment.serviceRequest.status === 'completed') return;
    setIsProcessing('complete_assessment');
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      await completeAssessment(assessment.serviceRequest.id, tokenResponse.accessToken);
      onClose();
    } catch (error) {
      console.error("Failed to complete assessment", error);
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleViewMedia = async (observation: any) => {
    setIsProcessing(observation.id);
    try {
        const attachment = observation.documentContent?.attachment;
        if (!attachment?.url) {
            alert("Media URL not found for this observation.");
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
        // correctd funcition call
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
        } else if (contentType.startsWith('model/')) { 
            // Get the model and patient names.
            const modelName = observation.code?.text || '3D Model';
            const patientName = assessment.serviceRequest.subject.display || 'Patient';
            
            const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=${encodeURIComponent(patientName)}&modelName=${encodeURIComponent(modelName)}`;
            router.push(workspaceUrl);
        } else {
          window.open(secureUrl, '_blank');
        }
    } catch (error) {
        console.error("Failed to generate secure media URL:", error);
        alert("An error occurred while trying to view the media.");
    } finally {
        setIsProcessing(null);
    }
  };
  
  const renderMediaModal = () => {
    if (!isModalOpen || !modalContent) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={() => setIsModalOpen(false)}>
        <div className="bg-white p-4 rounded-lg shadow-xl relative max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setIsModalOpen(false)} className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-black hover:bg-neutral-200 z-10"><X className="w-6 h-6" /></button>
          {modalContent.type === 'image' && <img src={modalContent.url} alt="Observation content" className="max-w-full max-h-[75vh] object-contain" />}
          {modalContent.type === 'video' && <video src={modalContent.url} controls autoPlay className="max-w-full max-h-[75vh]">Your browser does not support the video tag.</video>}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-2">{assessment.serviceRequest.code?.text}</h2>
      <p className="text-gray-500 mb-6">For: {assessment.serviceRequest.subject.display}</p>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Submitted Observations</h3>
          <div className="space-y-3">
            {assessment.observations.length > 0 ? (
              assessment.observations.map(obs => {
                const isViewed = obs.meta?.tag?.some((tag: any) => tag.system === 'https://revisit.humant.com/workflow-status' && tag.code === 'viewed');
                return (
                  <div key={obs.id} className="bg-gray-50 p-4 rounded-md border flex items-center">
                    <input
                      type="checkbox"
                      checked={isViewed}
                      onChange={(e) => handleCheckboxChange(obs.id, e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                      disabled={assessment.serviceRequest.status === 'completed' || isProcessing === obs.id}
                    />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-700">{obs.code.text}</p>
                    </div>
                    <button onClick={() => handleViewMedia(obs)} disabled={isProcessing === obs.id} className="btn-secondary text-sm ml-4 w-20 flex justify-center items-center">
                      {isProcessing === obs.id ? <Loader className="w-4 h-4 animate-spin" /> : 'View'}
                    </button>
                  </div>
                )
              })
            ) : <p className="text-gray-500 text-center py-4">No observations have been submitted for this assessment.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center pt-4 border-t">
        <div><span className="text-sm font-medium text-gray-700">{viewedObservations} of {totalObservations} Reviewed</span></div>
        <div className="space-x-2">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button
            onClick={handleCompleteAssessment}
            disabled={!isReviewComplete || assessment.serviceRequest.status === 'completed' || isProcessing !== null}
            className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed w-40 flex justify-center items-center"
          >
            {isProcessing === 'complete_assessment' ? <Loader className="w-5 h-5 animate-spin"/> : (assessment.serviceRequest.status === 'completed' ? 'Completed' : 'Complete Assessment')}
          </button>
        </div>
      </div>
      {renderMediaModal()}
    </div>
  );
};


// ============================================================================
//  MAIN COMPONENT: RemoteMonitoringPage
// ============================================================================
export default function RemoteMonitoringPage() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openModal, closeModal } = useDashboardModal();
  const { instance, accounts } = useMsal();

  const loadAssessments = useCallback(async () => {
    if (accounts.length === 0) {
      setIsLoading(false); return;
    }
    // remember to not set loading to true on refetch, to avoid screen flicker
    // setIsLoading(true); 

    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const bundle = await getAssessments(response.accessToken);
      
      if (bundle && bundle.entry) {
        const serviceRequests: FhirServiceRequest[] = [];
        const tasks: FhirTask[] = [];
        const observations: FhirObservation[] = [];
        const documentReferences: FhirDocumentReference[] = [];

        bundle.entry.forEach((e: any) => {
          if (!e.resource) return;
          const resourceType = e.resource.resourceType;
          if (resourceType === 'ServiceRequest') serviceRequests.push(e.resource);
          else if (resourceType === 'Task') tasks.push(e.resource);
          else if (resourceType === 'Observation') observations.push(e.resource);
          else if (resourceType === 'DocumentReference') documentReferences.push(e.resource);
        });

        const processed = serviceRequests.map((sr) => {
          const relatedTasks = tasks.filter(task => task.basedOn?.some(ref => ref.reference === `ServiceRequest/${sr.id}`));
          const relatedObservations = observations
            .filter(obs => obs.basedOn?.some(ref => ref.reference === `ServiceRequest/${sr.id}`))
            .map(obs => {
              const docRef = documentReferences.find(doc => doc.id && obs.derivedFrom?.some(ref => ref.reference === `DocumentReference/${doc.id}`));
              return { ...obs, documentContent: docRef?.content?.[0] };
            });
          return { serviceRequest: sr, tasks: relatedTasks, observations: relatedObservations, documentReferences };
        });
        setAssessments(processed);
      }
    } catch (error) {
      console.error("Failed to acquire token or fetch assessments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accounts, instance]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleAssessmentClick = (assessment: ProcessedAssessment) => {
    openModal(<AssessmentDetailModal assessment={assessment} onClose={closeModal} onUpdate={loadAssessments} />);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assessment Tracker</h1>
      {isLoading ? (
        <div className="flex justify-center items-center p-20"><Loader className="w-10 h-10 animate-spin text-blue-600" /></div>
      ) : assessments.length > 0 ? (
        <div className="space-y-4">
          {assessments.map(assessment => (
            <AssessmentCard key={assessment.serviceRequest.id} assessment={assessment} onClick={() => handleAssessmentClick(assessment)} />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Inbox className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No assessments found</h3>
          <p className="mt-1 text-sm text-gray-500">New assessments will appear here once they are created.</p>
        </div>
      )}
    </div>
  );
}