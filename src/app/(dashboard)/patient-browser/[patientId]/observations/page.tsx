"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FhirPatient, FhirObservation, FhirDocumentReference } from '@/types/global';
import { getObservationsForPatient } from '@/app/actions/observationActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Camera, Video, Box, Loader, Inbox, X, RefreshCw } from 'lucide-react';

export default function ObservationsPage() {
  const router = useRouter();
  const params = useParams();
  const { instance, accounts } = useMsal();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const [observations, setObservations] = useState<FhirObservation[]>([]);
  const [docReferences, setDocReferences] = useState<FhirDocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const loadData = useCallback(async () => {
    if (patientId && accounts.length > 0) {
      setIsLoading(true);
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        const bundle = await getObservationsForPatient(patientId, tokenResponse.accessToken);

        if (bundle?.entry) {
          const obs = bundle.entry
            .filter((e: any) => e.resource.resourceType === 'Observation')
            .map((e: any) => e.resource);
          const docs = bundle.entry
            .filter((e: any) => e.resource.resourceType === 'DocumentReference')
            .map((e: any) => e.resource);

          setObservations(obs);
          setDocReferences(docs);

      
          console.log("%c--- Verifying Links for All Fetched Observations ---", "color: purple; font-weight: bold;");
          const linkReport = obs.map(observation => {
            const docRef = docs.find(doc =>
              observation.derivedFrom?.some(ref => ref.reference?.endsWith(doc.id))
            );
            return {
              observationId: observation.id,
              mediaUrl: docRef?.content?.[0]?.attachment?.url || "--- URL NOT FOUND ---"
            };
          });
          console.table(linkReport);
        

        }
      } catch (error) {
        console.error("Failed to load observation data:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [patientId, accounts, instance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewModel = async (observation: FhirObservation) => {
    setIsGeneratingUrl(observation.id);
    try {
      const docRef = docReferences.find(doc =>
        observation.derivedFrom?.some(ref => ref.reference?.endsWith(doc.id))
      );

      if (!docRef?.content?.[0]?.attachment?.url) {
        alert("No document URL found. Please try refreshing the list and try again.");
        setIsGeneratingUrl(null);
        return;
      }
      
      const attachment = docRef.content[0].attachment;
      const contentType = attachment.contentType || '';
      const blobUrl = attachment.url;
      const containerName = "revisit-uploads";
      const blobName = blobUrl.split(`/${containerName}/`)[1];

      if (!blobName) {
        alert("Could not determine the file name from the URL.");
        setIsGeneratingUrl(null);
        return;
      }

      if (accounts.length === 0) {
        alert("Authentication error. Please log in again.");
        setIsGeneratingUrl(null);
        return;
      }
      
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const authToken = tokenResponse.accessToken;
      const secureUrl = await generateSecureModelUrl(blobName, authToken);

      if (!secureUrl) {
        alert("Failed to get a secure link to view the media.");
        setIsGeneratingUrl(null);
        return;
      }

      if (contentType.startsWith('model/')) {
        const modelName = observation.code?.coding?.[0]?.display || '3D Model';
        const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=Patient&modelName=${encodeURIComponent(modelName)}`;
        router.push(workspaceUrl);
      } else if (contentType.startsWith('image/')) {
        setModalContent({ url: secureUrl, type: 'image' });
        setIsModalOpen(true);
      } else if (contentType.startsWith('video/')) {
        setModalContent({ url: secureUrl, type: 'video' });
        setIsModalOpen(true);
      } else {
        window.open(secureUrl, '_blank');
      }
    } catch (error) {
      console.error("Token or URL generation failed:", error);
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

  if (isLoading && observations.length === 0) {
    return (<div className="flex justify-center items-center p-12"><Loader className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Submitted Observations</h3>
        <button onClick={loadData} disabled={isLoading} className="btn btn-secondary p-2 disabled:opacity-50">
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>
      {observations.length > 0 ? (
        <div className="space-y-3">
          {observations.map(obs => {
            const description = obs.code?.text || obs.code?.coding?.[0]?.display || 'Observation';
            const isModel = description.toLowerCase().includes('3d model');
            const isVideo = description.toLowerCase().includes('video');
            const isImage = description.toLowerCase().includes('image');
            return (
              <div key={obs.id} className="bg-neutral-50 p-4 rounded-lg border grid grid-cols-6 gap-4 items-center">
                <div className="col-span-1 flex items-center justify-center"><div className="bg-neutral-200 p-3 rounded-full">{isModel ? <Box className="w-5 h-5 text-neutral-600" /> : isVideo ? <Video className="w-5 h-5 text-neutral-600" /> : <Camera className="w-5 h-5 text-neutral-600" />}</div></div>
                <div className="col-span-3">
                  <p className="font-semibold text-neutral-800">{description}</p>
                  <p className="text-sm text-neutral-600">{obs.note?.[0]?.text || 'No additional notes.'}</p>
                  <p className="text-xs text-neutral-400 mt-1">Date: {new Date(obs.effectiveDateTime).toLocaleDateString()}</p>
                </div>
                <div className="col-span-1 text-center"><span className={`text-xs font-medium px-2 py-1 rounded-full ${obs.status === 'final' ? 'bg-success-light text-success' : 'bg-warning-light text-warning-dark'}`}>{obs.status}</span></div>
                <div className="col-span-1 text-right"><button onClick={() => handleViewModel(obs)} className="btn btn-secondary text-sm w-20 text-center" disabled={isGeneratingUrl === obs.id}>{isGeneratingUrl === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'View'}</button></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 text-neutral-500 bg-neutral-50 rounded-lg">
          <Inbox className="w-10 h-10 mx-auto text-neutral-400" />
          <p className="mt-2 font-medium">No observations found for this patient.</p>
        </div>
      )}
      {renderMediaModal()}
    </div>
  );
}