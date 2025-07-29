"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FhirPatient, FhirObservation, FhirDocumentReference } from '@/types/global';
import { getObservationsForPatient } from '@/app/actions/observationActions';
import { generateSecureModelUrl } from '@/app/actions/documentActions';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Camera, Video, Box, Loader, Inbox } from 'lucide-react';

export default function ObservationsPage() {
  const router = useRouter();
  const params = useParams();
  const { instance, accounts } = useMsal();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const [observations, setObservations] = useState<FhirObservation[]>([]);
  const [docReferences, setDocReferences] = useState<FhirDocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
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
          }
        } catch (error) {
          console.error("Failed to load observation data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadData();
  }, [patientId, accounts, instance]);

  const handleViewModel = async (observation: FhirObservation) => {
    setIsGeneratingUrl(observation.id);

    const docRef = docReferences.find(doc =>
      observation.derivedFrom?.some(ref => ref.reference === `DocumentReference/${doc.id}`)
    );

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

    if (accounts.length === 0) {
      alert("Authentication error. Please log in again.");
      setIsGeneratingUrl(null);
      return;
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      const authToken = tokenResponse.accessToken;
      const secureUrl = await generateSecureModelUrl(blobName, authToken);

      if (secureUrl) {
        const modelName = observation.code?.coding?.[0]?.display || '3D Model';
        const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=Patient&modelName=${encodeURIComponent(modelName)}`;
        router.push(workspaceUrl);
      } else {
        alert("Failed to get a secure link to view the model.");
      }
    } catch (error) {
      console.error("Token or URL generation failed:", error);
      alert("Authentication or secure link generation failed.");
    }

    setIsGeneratingUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-800">Submitted Observations</h3>
        <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{observations.length} total</span>
      </div>

      {observations.length > 0 ? (
        <div className="space-y-3">
          {observations.map(obs => {
            const description = obs.code.coding?.[0]?.display || 'Observation';
            const isModel = description.toLowerCase().includes('3d model');
            const isVideo = description.toLowerCase().includes('video');
            const isImage = description.toLowerCase().includes('image');
            return (
              <div key={obs.id} className="bg-neutral-50 p-4 rounded-lg border grid grid-cols-6 gap-4 items-center">
                <div className="col-span-1 flex items-center justify-center">
                  <div className="bg-neutral-200 p-3 rounded-full">
                    {isModel ? <Box className="w-5 h-5 text-neutral-600" /> :
                      isVideo ? <Video className="w-5 h-5 text-neutral-600" /> :
                        <Camera className="w-5 h-5 text-neutral-600" />}
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-neutral-800">{description}</p>
                  <p className="text-sm text-neutral-600">{obs.note?.[0]?.text || 'No additional notes.'}</p>
                  <p className="text-xs text-neutral-400 mt-1">Date: {new Date(obs.effectiveDateTime).toLocaleDateString()}</p>
                </div>
                <div className="col-span-1 text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${obs.status === 'final' ? 'bg-success-light text-success' : 'bg-warning-light text-warning-dark'}`}>
                    {obs.status}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleViewModel(obs)}
                    className="btn btn-secondary text-sm w-20 text-center"
                    disabled={isGeneratingUrl === obs.id}
                  >
                    {isGeneratingUrl === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'View'}
                  </button>
                </div>
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
    </div>
  );
}
