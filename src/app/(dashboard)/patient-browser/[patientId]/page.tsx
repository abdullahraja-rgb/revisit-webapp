    "use client";

    import React from 'react';
    import { useParams } from 'next/navigation';
    import { usePatientStore } from '@/stores/patientStore';
    import { User, Cake, Phone, Home as HomeIcon, Hash } from 'lucide-react';

    // A component to display a single detail item
    const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | undefined }) => (
        <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-6 mt-1 text-neutral-400">{icon}</div>
            <div>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="font-medium text-neutral-900">{value || 'N/A'}</p>
            </div>
        </div>
    );

    export default function PatientOverviewPage() {
        const params = useParams();
        const { getPatientById } = usePatientStore();
        const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
        const patient = getPatientById(patientId);

        if (!patient) {
            return <div>Loading...</div>;
        }

        const patientName = patient.name?.[0];
        const address = patient.address?.[0];
        const phone = patient.telecom?.find(t => t.system === 'phone')?.value;
        const nhsNumber = patient.identifier?.find(id => id.system.includes('nhs-number'))?.value;
        const mrn = patient.identifier?.find(id => id.type?.text === 'Medical Record Number')?.value;

        const calculateAge = (birthDate: string | undefined) => {
            if (!birthDate) return 'N/A';
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        };

        return (
            <div className="bg-white p-8 rounded-lg border border-neutral-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <DetailItem icon={<User size={20} />} label="Full Name" value={patientName ? `${patientName.given.join(' ')} ${patientName.family}` : 'N/A'} />
                    <DetailItem icon={<Cake size={20} />} label="Date of Birth" value={`${patient.birthDate} (${calculateAge(patient.birthDate)} years)`} />
                    <DetailItem icon={<Hash size={20} />} label="NHS Number" value={nhsNumber} />
                    <DetailItem icon={<Hash size={20} />} label="Medical Record Number" value={mrn} />
                    <DetailItem icon={<Phone size={20} />} label="Phone" value={phone} />
                    <DetailItem icon={<HomeIcon size={20} />} label="Address" value={address ? `${address.line?.[0]}, ${address.city}, ${address.postalCode}` : 'N/A'} />
                </div>
            </div>
        );
    }