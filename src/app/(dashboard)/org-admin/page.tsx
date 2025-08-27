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

// Fallback for unauthorized users
const AccessDenied = () => (
  <div className="flex items-center justify-center min-h-[500px] px-4">
    <div className="max-w-md w-full bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-2xl shadow-2xl border border-yellow-200/50 overflow-hidden">
      <div className="relative p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-orange-100/20"></div>
        <div className="relative text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl mb-6">
            <ShieldAlert className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h3>
          <p className="text-gray-700 leading-relaxed">
            You do not have the required 'Admin' role to access this page.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export default function AdminPage() {
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

  // Handler for managing practitioners 
  const handleManagePractitioners = () => {
    openModal(<ManagePractitioners onClose={closeModal} />, "4xl");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                  Organisational Admin Dashboard
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  Manage users, organizations, and care groups in your organisation
                </p>
              </div>
            </div>
          </div>
        </div>

        {isOrgAdmin ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* User Management Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-blue-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                    <p className="text-gray-600 mt-1">Invite & manage users</p>
                  </div>
                </div>
                <div className="space-y-4">
                    <button onClick={handleCreatePractitioner} className="w-full btn-primary text-lg flex items-center justify-center gap-3">
                        <UserPlus className="h-5 w-5" /> Create Practitioner
                    </button>
                    {/* Button for managing practitioners */}
                    <button onClick={handleManagePractitioners} className="w-full btn-secondary text-lg flex items-center justify-center gap-3">
                        <Edit className="h-5 w-5" /> Manage Practitioners
                    </button>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-emerald-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-300">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
                    <p className="text-gray-600 mt-1">Manage tenant organizations</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleCreateOrganization}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                  >
                    <Building className="h-5 w-5" />
                    Create Organization
                  </button>
                  <button
                    onClick={handleViewOrganizations}
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                  >
                    <Eye className="h-5 w-5" />
                    View Hierarchy
                  </button>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-purple-200/50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl group-hover:shadow-purple-500/50 group-hover:scale-110 transition-all duration-300">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Org Admins</h2>
                    <p className="text-gray-600 mt-1">Manage administrators</p>
                  </div>
                </div>
                <button
                  onClick={handleCreateOrgAdmin}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 text-lg"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Create Org Admin
                </button>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-orange-200/50 md:col-span-2 lg:col-span-3">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/10"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl group-hover:shadow-orange-500/50 group-hover:scale-110 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Care Group Management</h2>
                    <p className="text-gray-600 mt-1">Create and manage care groups across organizations</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <button
                    onClick={handleCreateCareGroup}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <Users className="h-5 w-5" />
                    Create New Care Group
                  </button>
                  <button
                    onClick={handleManageCareGroups}
                    className="bg-white/80 backdrop-blur-sm border-2 border-orange-300 hover:bg-orange-50 text-orange-700 font-semibold py-4 px-8 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <Edit className="h-5 w-5" />
                    Manage Existing Groups
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
