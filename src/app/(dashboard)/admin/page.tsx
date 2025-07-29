"use client";

import React from 'react';
import { useMsal } from "@azure/msal-react";
// Import the CreateOrganizationForm
import { CreatePractitionerForm, CreateOrganizationForm } from '@/components/view/(dashboard)/Forms';
import { useDashboardModal } from '@/app/(dashboard)/layout';
import { ShieldAlert } from 'lucide-react';

// A simple component to show when a user is not authorized.
const AccessDenied = () => (
    <div className="text-center p-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
        <ShieldAlert className="w-12 h-12 mx-auto text-yellow-500" />
        <h3 className="mt-2 text-xl font-bold text-neutral-900">Access Denied</h3>
        <p className="mt-1 text-base text-neutral-600">You do not have the required 'Admin' role to access this page.</p>
    </div>
);

export default function AdminPage() {
    const { accounts } = useMsal();
    const { openModal, closeModal } = useDashboardModal();
    
    const account = accounts[0];
    
    // --- THIS IS THE RBAC CHECK ---
    const roles = account?.idTokenClaims?.roles as string[] || [];
    const isAdmin = roles.includes('Admin'); // Check if the user has the "Admin" role

    const handleCreatePractitioner = () => {
        openModal(<CreatePractitionerForm onClose={closeModal} />, '2xl');
    };

    // --- NEW: Handler for creating an organization ---
    const handleCreateOrganization = () => {
        openModal(<CreateOrganizationForm onClose={closeModal} />, '2xl');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
            
            {isAdmin ? (
                // If the user is an admin, show the management sections
                <div className="space-y-6">
                    {/* User Management Section */}
                    <div className="bg-white p-6 rounded-lg border border-neutral-200">
                        <h2 className="text-xl font-semibold text-neutral-800 mb-4">User Management</h2>
                        <p className="text-neutral-600 mb-4">Create new practitioners and assign them to organizations.</p>
                        <button onClick={handleCreatePractitioner} className="btn btn-primary">
                            Create New Practitioner
                        </button>
                    </div>

                    {/* --- NEW: Organization Management Section --- */}
                    <div className="bg-white p-6 rounded-lg border border-neutral-200">
                        <h2 className="text-xl font-semibold text-neutral-800 mb-4">Organization Management</h2>
                        <p className="text-neutral-600 mb-4">Create new tenant organizations on the FHIR server.</p>
                        <button onClick={handleCreateOrganization} className="btn btn-primary">
                            Create New Organization
                        </button>
                    </div>
                </div>
            ) : (
                // If not an admin, show the Access Denied message
                <AccessDenied />
            )}
        </div>
    );
}