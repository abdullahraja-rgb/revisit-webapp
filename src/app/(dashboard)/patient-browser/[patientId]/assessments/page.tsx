"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getAssessmentsForPatient } from '@/app/actions/assessmentActions';
import { FhirServiceRequest } from '@/types/global';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { Loader, Inbox, FileText } from 'lucide-react';

export default function AssessmentsPage({ patient }: { patient: any }) {
  const params = useParams();
  const { instance, accounts } = useMsal();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const [assessments, setAssessments] = useState<FhirServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAssessments = async () => {
      if (patientId && accounts.length > 0) {
        setIsLoading(true);
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          const data = await getAssessmentsForPatient(patientId, tokenResponse.accessToken);
          setAssessments(data);
        } catch (error) {
          console.error("Failed to load assessments:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadAssessments();
  }, [patientId, accounts, instance]);

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
            <h3 className="text-lg font-semibold text-neutral-800">Assessments</h3>
            <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">{assessments.length} total</span>
        </div>
        {assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.map(assessment => {
                const assessmentType = assessment.code?.text || 'Assessment';
                const date = assessment.authoredOn ? new Date(assessment.authoredOn).toLocaleDateString() : 'N/A';
                return (
                    <div key={assessment.id} className="bg-neutral-50 p-4 rounded-lg border flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-neutral-200 p-3 rounded-full mr-4">
                                <FileText className="w-5 h-5 text-neutral-600"/>
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-800">{assessmentType}</p>
                                <p className="text-sm text-neutral-500">Created on: {date}</p>
                            </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${assessment.status === 'completed' ? 'bg-success-light text-success' : 'bg-blue-100 text-primary'}`}>
                            {assessment.status}
                        </span>
                    </div>
                );
              })}
            </div>
        ) : (
            <div className="text-center p-8 text-neutral-500 bg-neutral-50 rounded-lg">
                <Inbox className="w-10 h-10 mx-auto text-neutral-400" />
                <p className="mt-2 font-medium">No assessments found for this patient.</p>
            </div>
        )}
    </div>
  );
};