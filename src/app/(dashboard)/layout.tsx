"use client";

import React, { useState, createContext, useContext, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Home, Menu, Users, Shield } from 'lucide-react';
import Modal from '@/components/ui/Modal'; 
import AuthComponent from '@/components/view/(dashboard)/AuthComponent';
import LoginPage from '@/components/view/(dashboard)/LoginPage'; 
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useAuthRoles } from '@/hooks/useAuthRoles'; // Import your new hook

// --- Create a context to provide modal functions to child pages ---
type ModalContextType = {
  openModal: (content: ReactNode, size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Custom hook that child pages will use to access the modal functions
export const useDashboardModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useDashboardModal must be used within a DashboardLayout');
  }
  return context;
};

// The SidebarLink component
const SidebarLink = ({ href, icon, text, active = false }: { href: string, icon: React.ReactNode, text: string, active?: boolean }) => (
    <a
        href={href}
        className={`flex items-center px-4 py-3 rounded-lg transition-colors text-sm font-medium
            ${active
                ? 'bg-primary-light text-primary'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
    >
        {icon}
        <span>{text}</span>
    </a>
);

// This is the layout for an authenticated user
function AuthenticatedView({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { isAdmin } = useAuthRoles(); // Use the hook to check the user's role

    const navLinks = [
        { href: "/", text: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
        { href: "/patient-browser", text: "Patient Browser", icon: <Users className="w-5 h-5 mr-3" /> },
        { href: "/remote-monitoring", text: "Remote Monitoring", icon: <Activity className="w-5 h-5 mr-3" /> },
    ];
    
    const activeLink = navLinks
        .slice()
        .sort((a, b) => b.href.length - a.href.length)
        .find(link => pathname.startsWith(link.href));

    const currentPageTitle = activeLink ? activeLink.text : "Dashboard";

    return (
        <div className="flex h-screen bg-neutral-100">
            <aside 
                className={`w-64 bg-white border-r border-neutral-200 flex-shrink-0 transition-transform duration-300 ease-in-out fixed lg:relative h-full z-20 
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
                    <a href="/" className="flex items-center space-x-3">
                        <img src="/assets/images/logo/logo-icon.png" alt="Humant Logo" className="w-8 h-8" />
                        <span className="text-xl font-bold text-neutral-800">Humant</span>
                    </a>
                </div>
                <nav className="p-4 space-y-2">
                    {navLinks.map(link => (
                        <SidebarLink 
                            key={link.href}
                            href={link.href} 
                            icon={link.icon} 
                            text={link.text} 
                            active={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))} 
                        />
                    ))}

                    {/* --- Conditionally render the Admin link --- */}
                    {isAdmin && (
                        <>
                            <div className="pt-2 mt-2 border-t border-neutral-200"></div>
                            <SidebarLink 
                                href="/admin" 
                                icon={<Shield className="w-5 h-5 mr-3" />} 
                                text="Admin" 
                                active={pathname.startsWith('/admin')} 
                            />
                        </>
                    )}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 rounded-md text-neutral-500 hover:bg-neutral-100">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-neutral-800">{currentPageTitle}</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <AuthComponent />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

// This is the main layout component that acts as a gatekeeper
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);
    const [modalSize, setModalSize] = useState<'lg' | '4xl'>('lg');

    const openModal = (content: ReactNode, size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' = 'lg') => {
        setModalSize(size);
        setModalContent(content);
    };
    
    const closeModal = () => setModalContent(null);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            <Modal isOpen={!!modalContent} onClose={closeModal} size={modalSize}>
                {modalContent}
            </Modal>
            
            <AuthenticatedTemplate>
                <AuthenticatedView>{children}</AuthenticatedView>
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <LoginPage />
            </UnauthenticatedTemplate>
        </ModalContext.Provider>
    );
}
