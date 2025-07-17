"use client";

import React, { useState, useEffect } from 'react';
import { getAssessments } from '@/app/actions/monitoringActions';
import { FhirServiceRequest, FhirTask } from '@/types/global';
import { useDashboardModal } from '@/app/(dashboard)/layout';
import { Loader, CheckCircle, AlertCircle, Clock, Inbox } from 'lucide-react';

// Define a new type for our processed assessment data
type ProcessedAssessment = {
  serviceRequest: FhirServiceRequest;
  tasks: FhirTask[];
  totalTasks: number;
  completedTasks: number;
  progress: number;
};

// --- Child Components for the Page ---

// Card to display a single assessment
const AssessmentCard = ({ assessment, onClick }: { assessment: ProcessedAssessment, onClick: () => void }) => {
  const { serviceRequest, progress, totalTasks, completedTasks } = assessment;
  const patientName = serviceRequest.subject.display || `Patient/${serviceRequest.subject.reference.split('/')[1]}`;
  const assessmentType = serviceRequest.code?.text || 'Assessment';

  const getStatusInfo = () => {
    if (serviceRequest.status === 'completed') {
      return { text: 'Completed', icon: <CheckCircle className="w-4 h-4 text-green-600" />, color: 'bg-green-100 text-green-800' };
    }
    if (progress > 0 && progress < 100) {
      return { text: 'In Progress', icon: <Clock className="w-4 h-4 text-blue-600" />, color: 'bg-blue-100 text-blue-800' };
    }
    return { text: 'Requested', icon: <AlertCircle className="w-4 h-4 text-yellow-600" />, color: 'bg-yellow-100 text-yellow-800' };
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
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{completedTasks} / {totalTasks} Tasks</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

// Modal to show the details of an assessment's tasks
const TaskDetailModal = ({ assessment, onClose }: { assessment: ProcessedAssessment, onClose: () => void }) => {
    return (
        <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">{assessment.serviceRequest.code?.text}</h2>
            <p className="text-gray-500 mb-6">For: {assessment.serviceRequest.subject.display}</p>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {assessment.tasks.length > 0 ? (
                    assessment.tasks.map(task => (
                        // --- KEY PROP LOCATION #1 ---
                        // This key is crucial for the list of tasks inside the modal.
                        <div key={task.id} className="bg-gray-50 p-4 rounded-md border flex justify-between items-center">
                            <p className="font-medium text-gray-700">{task.description}</p>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                {task.status}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-4">No tasks found for this assessment.</p>
                )}
            </div>
            <div className="mt-6 text-right">
                <button onClick={onClose} className="btn-secondary">Close</button>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function RemoteMonitoringPage() {
  const [assessments, setAssessments] = useState<ProcessedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { openModal, closeModal } = useDashboardModal();

  useEffect(() => {
    const loadAssessments = async () => {
      setIsLoading(true);
      const bundle = await getAssessments();
      
      if (bundle && bundle.entry) {
        const serviceRequests = bundle.entry
          .filter((e: any) => e.resource.resourceType === 'ServiceRequest')
          .map((e: any) => e.resource);

        const tasks = bundle.entry
          .filter((e: any) => e.resource.resourceType === 'Task')
          .map((e: any) => e.resource);

        const processed = serviceRequests.map((sr: FhirServiceRequest) => {
          const relatedTasks = tasks.filter((task: FhirTask) => 
            task.basedOn?.some(ref => ref.reference === `ServiceRequest/${sr.id}`)
          );
          const completedTasks = relatedTasks.filter(t => t.status === 'completed').length;
          const totalTasks = relatedTasks.length;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return { serviceRequest: sr, tasks: relatedTasks, totalTasks, completedTasks, progress };
        });

        setAssessments(processed);
      }
      setIsLoading(false);
    };

    loadAssessments();
  }, []);

  const handleAssessmentClick = (assessment: ProcessedAssessment) => {
    openModal(
        <TaskDetailModal assessment={assessment} onClose={closeModal} />
    );
  };

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Assessment Tracker</h1>
        
        {isLoading ? (
            <div className="flex justify-center items-center p-20">
                <Loader className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        ) : assessments.length > 0 ? (
            <div className="space-y-4">
                {assessments.map(assessment => (
                    // --- KEY PROP LOCATION #2 ---
                    // This key is crucial for the main list of assessment cards.
                    <AssessmentCard 
                        key={assessment.serviceRequest.id} 
                        assessment={assessment}
                        onClick={() => handleAssessmentClick(assessment)}
                    />
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