"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { useDashboardModal } from "@/app/(dashboard)/layout";

import { getAssessments, setObservationViewedStatus, completeAssessment } from "@/app/actions/monitoringActions";
import { generateSecureModelUrl } from "@/app/actions/documentActions";

import type { FhirServiceRequest, FhirTask, FhirObservation, FhirDocumentReference } from "@/types/global";
import { Loader, CheckCircle, Clock, Inbox, X, Activity, FileText, Camera, Video, User } from "lucide-react";
import { Cable as Cube } from "lucide-react"; // Renamed to avoid conflict with React component naming conventions

type ProcessedAssessment = {
  serviceRequest: FhirServiceRequest;
  tasks: FhirTask[];
  observations: any[]; // Using 'any' for enriched observations with 'documentContent'
  documentReferences: FhirDocumentReference[];
};

// ============================================================================
//  UI Constants & Helper Components
// ============================================================================
const COLORS = {
  primary: '#005fee',
  secondary: '#3583f7',
  accent: '#6aa6ff',
  text: '#4c4c4c',
  bg: '#fcfcfc',
};

const GradientLine = () => (
  <div
    className="h-[2px] w-28 mx-auto rounded-full"
    style={{
      background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
    }}
  />
);

const StatusBadge = ({ status }: { status: 'completed' | 'in-progress' | string }) => {
  const isCompleted = status === 'completed';
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} />
      {isCompleted ? 'Completed' : 'In Progress'}
    </span>
  );
};


// ============================================================================
//  SUB-COMPONENT: AssessmentCard
// ============================================================================
const AssessmentCard = ({ assessment, onClick }: { assessment: ProcessedAssessment; onClick: () => void }) => {
  const { serviceRequest, observations } = assessment;
  const patientName = serviceRequest.subject.display || `Patient/${serviceRequest.subject.reference.split("/")[1]}`;
  const assessmentType = serviceRequest.code?.text || "Assessment";

  const totalObservations = observations.length;
  const viewedObservations = observations.filter((obs) =>
    obs.meta?.tag?.some(
      (tag: any) => tag.system === "https://revisit.humant.com/workflow-status" && tag.code === "viewed",
    ),
  ).length;
  const progress = totalObservations > 0 ? (viewedObservations / totalObservations) * 100 : 0;

  const getAssessmentIcon = () => {
    const type = assessmentType.toLowerCase();
    const iconProps = { className: "w-6 h-6", color: COLORS.secondary };
    if (type.includes("mobility") || type.includes("movement")) return <Activity {...iconProps} />;
    if (type.includes("cognitive") || type.includes("mental")) return <FileText {...iconProps} />;
    if (type.includes("visual") || type.includes("photo")) return <Camera {...iconProps} />;
    if (type.includes("video") || type.includes("motion")) return <Video {...iconProps} />;
    if (type.includes("3d") || type.includes("model")) return <Cube {...iconProps} />;
    return <Activity {...iconProps} />;
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 4px 16px rgba(0, 95, 238, 0.06)' }}
    >
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#f0f7ff' }}
            >
              {getAssessmentIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xl mb-1 truncate text-balance" style={{ color: COLORS.text }}>
                {assessmentType}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span className="truncate">{patientName}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={serviceRequest.status || 'in-progress'} />
        </div>

        <div className="space-y-2 mb-6">
           <div className="flex justify-between items-center text-sm mb-1" style={{ color: COLORS.text }}>
             <span className="font-semibold">Review Progress</span>
             <span className="font-bold">
               {viewedObservations} of {totalObservations} Reviewed
             </span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
             <div
               className="h-2.5 rounded-full transition-all duration-700"
               style={{
                 width: `${progress}%`,
                 background: progress === 100
                   ? "linear-gradient(90deg, #10b981, #34d399)"
                   : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
               }}
             ></div>
           </div>
        </div>
        
        <button
          onClick={onClick}
          className="w-full px-4 py-2 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        >
          Review Assessment
        </button>
      </div>
    </div>
  );
};


// ============================================================================
//  SUB-COMPONENT: AssessmentDetailModal
// ============================================================================
const AssessmentDetailModal = ({
  assessment,
  onClose,
  onUpdate,
}: { assessment: ProcessedAssessment; onClose: () => void; onUpdate: () => void }) => {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaContent, setMediaContent] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const totalObservations = assessment.observations.length;
  const viewedObservations = assessment.observations.filter((obs) =>
    obs.meta?.tag?.some(
      (tag: any) => tag.system === "https://revisit.humant.com/workflow-status" && tag.code === "viewed",
    ),
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
    if (!isReviewComplete || assessment.serviceRequest.status === "completed") return;
    setIsProcessing("complete_assessment");
    try {
      const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      await completeAssessment(assessment.serviceRequest.id!, tokenResponse.accessToken);
      onClose(); // This will trigger a re-fetch on the main page
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
      const blobName = attachment.url.split("/revisit-uploads/")[1];
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
      
      const contentType = attachment.contentType || "";
      if (contentType.startsWith("image/")) {
        setMediaContent({ url: secureUrl, type: "image" });
        setMediaViewerOpen(true);
      } else if (contentType.startsWith("video/")) {
        setMediaContent({ url: secureUrl, type: "video" });
        setMediaViewerOpen(true);
      } else if (contentType.startsWith("model/")) {
        const modelName = observation.code?.text || "3D Model";
        const patientName = assessment.serviceRequest.subject.display || "Patient";
        const workspaceUrl = `/workspace?modelUrl=${encodeURIComponent(secureUrl)}&patientName=${encodeURIComponent(patientName)}&modelName=${encodeURIComponent(modelName)}`;
        router.push(workspaceUrl);
      } else {
        window.open(secureUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to generate secure media URL:", error);
      alert("An error occurred while trying to view the media.");
    } finally {
      setIsProcessing(null);
    }
  };

  const renderMediaViewer = () => {
    if (!isMediaViewerOpen || !mediaContent) return null;
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
        onClick={() => setMediaViewerOpen(false)}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMediaViewerOpen(false)}
            className="absolute -top-3 -right-3 bg-white rounded-full p-2 text-black hover:bg-gray-200 transition-all z-10 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          {mediaContent.type === "image" && (
            <img src={mediaContent.url} alt="Observation content" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          )}
          {mediaContent.type === "video" && (
            <video src={mediaContent.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl">
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-2xl p-8 shadow-2xl">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-bold mb-1" style={{ color: COLORS.text }}>
          {assessment.serviceRequest.code?.text}
        </h2>
        <p className="text-gray-600">For: <span className="font-medium">{assessment.serviceRequest.subject.display}</span></p>
      </div>

      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-4 -mr-4">
        <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>
          Submitted Observations
        </h3>
        {assessment.observations.length > 0 ? (
          assessment.observations.map((obs) => {
            const isViewed = obs.meta?.tag?.some(
              (tag: any) => tag.system === "https://revisit.humant.com/workflow-status" && tag.code === "viewed",
            );
            return (
              <div key={obs.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                   <input
                     type="checkbox"
                     checked={isViewed}
                     onChange={(e) => handleCheckboxChange(obs.id, e.target.checked)}
                     className="h-5 w-5 rounded border-gray-300 focus:ring-2 cursor-pointer flex-shrink-0"
                     style={{ accentColor: COLORS.primary, '--tw-ring-color': COLORS.secondary } as React.CSSProperties}
                     disabled={assessment.serviceRequest.status === "completed" || isProcessing === obs.id}
                   />
                   <p className="font-medium" style={{ color: COLORS.text }}>{obs.code.text}</p>
                </div>
                <button
                  onClick={() => handleViewMedia(obs)}
                  disabled={isProcessing === obs.id}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 w-24 text-center"
                   style={{ color: COLORS.text }}
                >
                  {isProcessing === obs.id ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : "View"}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500">No observations submitted yet.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
        <span className="text-sm font-medium" style={{ color: COLORS.text }}>
          {viewedObservations} of {totalObservations} items reviewed
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            style={{ color: COLORS.text }}
          >
            Close
          </button>
          <button
            onClick={handleCompleteAssessment}
            disabled={!isReviewComplete || assessment.serviceRequest.status === "completed" || isProcessing !== null}
            className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed w-44 flex justify-center items-center"
            style={{ 
                background: assessment.serviceRequest.status === 'completed'
                    ? '#10b981' // Green for completed
                    : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`
            }}
          >
            {isProcessing === "complete_assessment" ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : assessment.serviceRequest.status === "completed" ? (
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Completed</span>
            ) : (
              "Complete Assessment"
            )}
          </button>
        </div>
      </div>
      {renderMediaViewer()}
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
    setIsLoading(true);
    if (accounts.length === 0) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
      const bundle = await getAssessments(response.accessToken);

      if (bundle && bundle.entry) {
        const resources = bundle.entry.map((e: any) => e.resource).filter(Boolean);
        const serviceRequests: FhirServiceRequest[] = resources.filter((r: any) => r.resourceType === 'ServiceRequest');
        const tasks: FhirTask[] = resources.filter((r: any) => r.resourceType === 'Task');
        const observations: FhirObservation[] = resources.filter((r: any) => r.resourceType === 'Observation');
        const documentReferences: FhirDocumentReference[] = resources.filter((r: any) => r.resourceType === 'DocumentReference');

        const docRefMap = new Map(documentReferences.map(doc => [`DocumentReference/${doc.id}`, doc]));

        const processed = serviceRequests.map((sr) => {
          const relatedObservations = observations
            .filter((obs) => obs.basedOn?.some((ref) => ref.reference === `ServiceRequest/${sr.id}`))
            .map((obs) => {
              const docRefLink = obs.derivedFrom?.[0]?.reference;
              const docRef = docRefLink ? docRefMap.get(docRefLink) : undefined;
              return { ...obs, documentContent: docRef?.content?.[0] };
            });
          
          // Sort assessments: in-progress first, then by date.
          const sortedObservations = relatedObservations.sort((a,b) => (a.effectiveDateTime && b.effectiveDateTime) ? new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime() : 0);

          return {
            serviceRequest: sr,
            tasks: tasks.filter(task => task.basedOn?.some(ref => ref.reference === `ServiceRequest/${sr.id}`)),
            observations: sortedObservations,
            documentReferences, // This is less efficient but simpler for now
          };
        }).sort((a, b) => {
            const statusA = a.serviceRequest.status === 'completed' ? 1 : 0;
            const statusB = b.serviceRequest.status === 'completed' ? 1 : 0;
            return statusA - statusB;
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
    <div className="min-h-screen relative" style={{ backgroundColor: COLORS.bg }}>
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-10 left-8 w-64 h-64 opacity-10 rotate-12">
           <div
             className="w-full h-full"
             style={{
               background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
               clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 80%)',
             }}
           />
         </div>
         <div className="absolute bottom-20 right-10 w-48 h-48 opacity-10 -rotate-12">
           <div
             className="w-full h-full"
             style={{
               background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.secondary})`,
               clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 0 100%)',
             }}
           />
         </div>
       </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div
                className="p-4 rounded-full shadow-md"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
              >
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>
              Assessment Tracker
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Monitor, review, and complete patient assessments with comprehensive progress tracking.
            </p>
            <div className="mt-4">
              <GradientLine />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-20">
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORS.primary }} />
                <p className="text-gray-500 font-medium">Loading assessments...</p>
              </div>
            </div>
          ) : assessments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {assessments.map((assessment, index) => (
                <div
                  key={assessment.serviceRequest.id}
                  className="animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AssessmentCard assessment={assessment} onClick={() => handleAssessmentClick(assessment)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow"
                style={{ backgroundColor: '#f0f7ff' }}
              >
                <Inbox className="w-10 h-10" style={{ color: COLORS.primary }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: COLORS.text }}>
                No assessments found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                New assessments for your patients will appear here once they are created.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}