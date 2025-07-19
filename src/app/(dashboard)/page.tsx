"use client";

import React from 'react';
import Link from 'next/link';
import { Users, BarChart3 } from 'lucide-react';
import { useMsal } from "@azure/msal-react";

// A reusable component for the main navigation cards with improved styling
const DashboardCard = ({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) => (
    <Link href={href}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-light text-primary rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                {icon}
            </div>
            <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-2">{title}</h2>
                <p className="text-neutral-500 flex-grow">{description}</p>
            </div>
        </div>
    </Link>
);

export default function LandingPage() {
    const { accounts } = useMsal();
    const userName = accounts[0]?.name?.split(' ')[0] || 'Practitioner';

    return (
        <div className="max-w-7xl mx-auto">
            {/* Improved Header Section with Gradient Background */}
            <div className="bg-gradient-to-r from-primary to-blue-500 text-white p-8 rounded-xl shadow-lg mb-10">
                <h1 className="text-4xl font-bold">Welcome, {userName}</h1>
                <p className="mt-2 text-lg opacity-90">This is your central hub for managing patient care.</p>
            </div>
            
            {/* Main Workflow Cards */}
            <div>
                <h2 className="text-2xl font-bold text-neutral-800 mb-4">Start a Workflow</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DashboardCard 
                        href="/patient-browser"
                        icon={<Users className="w-6 h-6" />}
                        title="Patient Browser"
                        description="Search, view, and manage all patients within your organization. Create new patient and carer profiles."
                    />
                    <DashboardCard 
                        href="/remote-monitoring"
                        icon={<BarChart3 className="w-6 h-6" />}
                        title="Remote Monitoring"
                        description="Track the status of all ongoing assessments, review submitted tasks, and manage patient care workflows."
                    />
                </div>
            </div>
        </div>
    );
}