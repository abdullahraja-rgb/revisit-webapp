    "use client";

    import React from 'react';
    import Link from 'next/link';
    import { usePathname, useParams } from 'next/navigation';
    import { usePatientStore } from '@/stores/patientStore';
    import { ChevronLeft, Plus } from 'lucide-react';
    import { useDashboardModal } from '@/app/(dashboard)/layout';
    import { CreateAssessmentForm } from '@/components/view/(dashboard)/Forms';

    // This is the main layout for a single patient's profile page
    export default function PatientProfileLayout({ children }: { children: React.ReactNode }) {
        const params = useParams();
        const pathname = usePathname();
        const { getPatientById } = usePatientStore();
        const { openModal, closeModal } = useDashboardModal();

        const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
        const patient = getPatientById(patientId);

        if (!patient) {
            return <div className="p-8 text-center">Loading patient data or patient not found...</div>;
        }

        const patientName = patient.name?.[0];
        const displayName = patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'Patient Profile';
        const nhsNumber = patient.identifier?.find(id => id.system.includes('nhs-number'))?.value;

        const handleCreateAssessment = () => {
            openModal(<CreateAssessmentForm onClose={closeModal} patient={patient} />, '2xl');
        };

        const navLinks = [
            { href: `/patient-browser/${patientId}`, text: 'Overview' },
            { href: `/patient-browser/${patientId}/observations`, text: 'Observations' },
            { href: `/patient-browser/${patientId}/assessments`, text: 'Assessments' },
        ];

        return (
            <div className="space-y-6">
                {/* Patient Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Link href="/patient-browser" className="p-2 rounded-full hover:bg-neutral-100">
                            <ChevronLeft className="w-6 h-6 text-neutral-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">{displayName}</h1>
                            <p className="text-sm text-neutral-500">NHS: {nhsNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <button onClick={handleCreateAssessment} className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Assessment
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-neutral-200">
                    <nav className="-mb-px flex space-x-6">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href}>
                                <span className={`py-3 px-1 border-b-2 font-medium text-sm ${pathname === link.href ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'}`}>
                                    {link.text}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Page Content (Overview, Observations, etc.) */}
                <div>
                    {children}
                </div>
            </div>
        );
    }