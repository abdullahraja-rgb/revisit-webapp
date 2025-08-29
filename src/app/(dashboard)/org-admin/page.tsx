"use client";

import React from 'react';
import { useAuthRoles } from '@/hooks/useAuthRoles';
import {
  CreatePractitionerForm,
  CreateOrganizationForm,
  CreateCareGroupForm,
  CreateOrganizationAdminForm,
  ManageCareGroups,
  ManagePractitioners, 
} from '@/components/view/(dashboard)/Forms';
import OrganizationHierarchyViewer from "@/components/view/(dashboard)/OrganizationHierarchyViewer";
import { useDashboardModal } from "@/app/(dashboard)/layout";
import {
  ShieldAlert,
  UserPlus,
  Building,
  Users,
  ShieldCheck,
  Edit,
  Eye,
} from 'lucide-react';
import Image from 'next/image';

// Fallback for unauthorized users - styled like the main admin page
const AccessDenied = () => (
  <div className="flex items-center justify-center min-h-[500px] px-4">
    <div className="relative max-w-md w-full">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#005fee]/10 transform rotate-45 rounded-2xl"></div>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#6aa6ff]/20 transform -rotate-12 rounded-2xl"></div>
      <div className="relative bg-[#fcfcfc] rounded-2xl shadow-2xl border border-[#005fee]/10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#005fee] via-[#3583f7] to-[#6aa6ff]"></div>
        <div className="p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#005fee] shadow-xl mb-6">
            <ShieldAlert className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#4c4c4c] mb-3">Access Denied</h3>
          <p className="text-[#4c4c4c]/70 leading-relaxed">
            You do not have the required permissions to access this page.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default function OrgAdminPage() {
  const { openModal, closeModal } = useDashboardModal();
  const { isOrgAdmin } = useAuthRoles();

  const handleCreatePractitioner = () => {
    openModal(<CreatePractitionerForm onClose={closeModal} />, "2xl");
  };

  const handleCreateOrganization = () => {
    openModal(<CreateOrganizationForm onClose={closeModal} />, "2xl");
  };

  const handleCreateOrgAdmin = () => {
    openModal(<CreateOrganizationAdminForm onClose={closeModal} />, "2xl");
  };

  const handleCreateCareGroup = () => {
    openModal(<CreateCareGroupForm onClose={closeModal} />, "2xl");
  };

  const handleManageCareGroups = () => {
    openModal(<ManageCareGroups onClose={closeModal} />, "4xl");
  };

  const handleViewOrganizations = () => {
    openModal(<OrganizationHierarchyViewer />, "3xl");
  };
  
  const handleManagePractitioners = () => {
    openModal(<ManagePractitioners onClose={closeModal} />, "4xl");
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative mb-16">
          <div className="absolute -top-4 -right-8 w-64 h-32 bg-[#005fee]/5 transform rotate-12 rounded-3xl blur-sm"></div>
          <div className="absolute -bottom-2 -left-4 w-48 h-24 bg-[#6aa6ff]/10 transform -rotate-6 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-[#005fee]/10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#005fee] via-[#3583f7] to-[#6aa6ff]"></div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-bl from-[#005fee]/5 to-transparent"></div>
            <div className="relative p-10">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <div className="absolute -inset-2 bg-[#005fee]/10 rounded-3xl transform rotate-2"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#005fee] shadow-2xl transform -rotate-2">
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <Image src="/assets/images/logo/logo-icon.png" alt="HUMANT" width={120} height={40} className="h-8 w-auto" />
                    <div className="h-8 w-px bg-[#005fee]/20"></div>
                    <span className="text-[#4c4c4c]/60 font-medium">Humant-Revisit</span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-[#4c4c4c] mb-2 text-balance">
                    Organization Admin Dashboard
                  </h1>
                  <p className="text-lg text-[#4c4c4c]/70 font-medium text-pretty">
                    Manage users and care groups within your organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isOrgAdmin ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* User Management Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-[#005fee]/10">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#005fee]/5 transform rotate-45 rounded-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#6aa6ff]/10 transform -rotate-12 rounded-xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[#005fee]/10 rounded-2xl transform rotate-2 group-hover:rotate-6 transition-transform duration-300"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#005fee] shadow-lg group-hover:shadow-[#005fee]/30 group-hover:scale-105 transition-all duration-300 transform -rotate-2">
                      <UserPlus className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4c4c4c]">User Management</h2>
                    <p className="text-[#4c4c4c]/60 mt-1 text-sm">Invite & manage users</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={handleCreatePractitioner} className="w-full bg-[#005fee] hover:bg-[#3583f7] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                    <UserPlus className="h-4 w-4" /> Create Practitioner
                  </button>
                  <button onClick={handleManagePractitioners} className="w-full bg-white border border-[#005fee]/20 hover:bg-[#005fee]/5 text-[#005fee] font-semibold py-3 px-6 rounded-2xl hover:shadow-md transition-all duration-300 text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                    <Edit className="h-4 w-4" /> Manage Practitioners
                  </button>
                </div>
              </div>
            </div>
            
            {/* Organizations Card - Restored */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-[#3583f7]/10">
              <div className="absolute top-0 left-0 w-20 h-20 bg-[#3583f7]/5 transform -rotate-12 rounded-2xl"></div>
              <div className="absolute -bottom-2 -right-2 w-18 h-18 bg-[#6aa6ff]/10 transform rotate-45 rounded-xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[#3583f7]/10 rounded-2xl transform -rotate-2 group-hover:-rotate-6 transition-transform duration-300"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3583f7] shadow-lg group-hover:shadow-[#3583f7]/30 group-hover:scale-105 transition-all duration-300 transform rotate-2">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4c4c4c]">Organizations</h2>
                    <p className="text-[#4c4c4c]/60 mt-1 text-sm">Manage tenant organizations</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={handleCreateOrganization} className="w-full bg-[#3583f7] hover:bg-[#6aa6ff] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:-translate-y-0.5">
                    <Building className="h-4 w-4" /> Create Organization
                  </button>
                  <button onClick={handleViewOrganizations} className="w-full bg-white border border-[#3583f7]/20 hover:bg-[#3583f7]/5 text-[#3583f7] font-semibold py-3 px-6 rounded-2xl hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:-translate-y-0.5">
                    <Eye className="h-4 w-4" /> View Hierarchy
                  </button>
                </div>
              </div>
            </div>
            
            {/* Org Admins Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-[#6aa6ff]/10">
              <div className="absolute top-0 right-0 w-28 h-14 bg-[#6aa6ff]/5 transform rotate-12 rounded-xl"></div>
              <div className="absolute -bottom-3 -left-3 w-20 h-20 bg-[#005fee]/5 transform -rotate-45 rounded-2xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-[#6aa6ff]/10 rounded-2xl transform rotate-3 group-hover:rotate-12 transition-transform duration-300"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6aa6ff] shadow-lg group-hover:shadow-[#6aa6ff]/30 group-hover:scale-105 transition-all duration-300 transform -rotate-3">
                      <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4c4c4c]">Org Admins</h2>
                    <p className="text-[#4c4c4c]/60 mt-1 text-sm">Manage administrators</p>
                  </div>
                </div>
                <button onClick={handleCreateOrgAdmin} className="w-full bg-[#6aa6ff] hover:bg-[#005fee] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:-translate-y-0.5">
                  <ShieldCheck className="h-4 w-4" /> Create Org Admin
                </button>
              </div>
            </div>
            
            {/* Care Group Management Card - Restored with correct layout */}
            <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-[#005fee]/10 md:col-span-2 lg:col-span-3">
              <div className="absolute top-0 left-0 w-40 h-20 bg-[#005fee]/5 transform rotate-6 rounded-3xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#3583f7]/5 transform -rotate-12 rounded-3xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-[#005fee]/10 rounded-3xl transform -rotate-2 group-hover:-rotate-6 transition-transform duration-300"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-[#005fee] shadow-lg group-hover:shadow-[#005fee]/30 group-hover:scale-105 transition-all duration-300 transform rotate-2">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#4c4c4c]">Care Group Management</h2>
                    <p className="text-[#4c4c4c]/60 mt-1 text-sm">Create and manage care groups across organizations</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button onClick={handleCreateCareGroup} className="bg-[#005fee] hover:bg-[#3583f7] text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm transform hover:-translate-y-0.5">
                    <Users className="h-4 w-4" /> Create New Care Group
                  </button>
                  <button onClick={handleManageCareGroups} className="bg-white border border-[#005fee]/20 hover:bg-[#005fee]/5 text-[#005fee] font-semibold py-3 px-6 rounded-2xl hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm transform hover:-translate-y-0.5">
                    <Edit className="h-4 w-4" /> Manage Existing Groups
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AccessDenied />
        )}
      </div>
    </div>
  )
}