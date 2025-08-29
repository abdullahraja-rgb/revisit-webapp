"use client";

import React, { useState, createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Activity, Menu, Users, Shield, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal'; 
import AuthComponent from '@/components/view/(dashboard)/AuthComponent';
import LoginPage from '@/components/view/(dashboard)/LoginPage'; 
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useAuthRoles } from '@/hooks/useAuthRoles';
import { clsx } from "clsx";
import gsap from "gsap";

// ============================================================================
//  1. The Upgraded Sidebar Component
// ============================================================================
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  navLinks: NavLink[];
  activePageLabel: string;
}

interface NavLink {
    href: string;
    text: string;
    icon: React.ElementType;
}

function Sidebar({ collapsed, onToggle, navLinks, activePageLabel }: SidebarProps) {
  const textElementsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const textElements = textElementsRef.current.filter(Boolean) as HTMLElement[];
    if (collapsed) {
      gsap.to(textElements, {
        opacity: 0,
        x: -10,
        duration: 0.2,
        stagger: 0.02,
        ease: "power2.out",
      });
    } else {
      gsap.to(textElements, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.03,
        delay: 0.2,
        ease: "power2.out",
      });
    }
  }, [collapsed]);

  return (
    <aside
      // **FIX APPLIED HERE**: Removed the `overflow-hidden` class
      className={`relative flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-blue-500/10 bg-white/60 backdrop-blur-xl ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="absolute top-20 -left-4 w-24 h-24 bg-blue-500/5 rounded-2xl transform rotate-45 opacity-50"></div>
      <div className="absolute bottom-20 -right-4 w-24 h-24 bg-blue-200/5 rounded-2xl transform -rotate-45 opacity-50"></div>

      <div className="relative flex items-center gap-3 px-4 border-b border-blue-500/10 h-16">
        <img src="/assets/images/logo/logo-icon.png" alt="Humant Logo" className="w-8 h-8 flex-shrink-0" />
        <div className={`overflow-hidden transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
            <span ref={el => textElementsRef.current[0] = el} className="text-xl font-bold text-gray-800 whitespace-nowrap">Humant</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navLinks.map((item, index) => {
          const isActive = activePageLabel === item.text;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "w-full flex items-center text-sm font-medium rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 group",
                collapsed ? "h-12 w-12 mx-auto justify-center" : "px-4 py-3",
                isActive
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-500 hover:bg-blue-500/5"
              )}
            >
              <item.icon className={clsx(
                "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                !isActive && "text-blue-500 group-hover:text-blue-600"
              )} />
              <span
                ref={el => textElementsRef.current[index + 1] = el}
                className={clsx("ml-3 whitespace-nowrap transition-colors duration-300", 
                  collapsed && "hidden",
                  !isActive && "group-hover:text-blue-600"
                )}
              >
                {item.text}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="relative p-4 mt-auto h-16 border-t border-blue-500/10">
        <button
            onClick={onToggle}
            className="absolute top-1/2 -right-4 h-8 w-8 bg-white border border-blue-500/10 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white hover:scale-110 shadow-md transition-all duration-300"
            style={{ transform: 'translateY(-50%)' }}
        >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

// ============================================================================
//  2. The Modal Context (Unchanged)
// ============================================================================
type ModalContextType = {
  openModal: (content: ReactNode, size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl') => void;
  closeModal: () => void;
};
const ModalContext = createContext<ModalContextType | undefined>(undefined);
export const useDashboardModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useDashboardModal must be used within a DashboardLayout');
  return context;
};

// ============================================================================
//  3. The Authenticated Layout View
// ============================================================================
function AuthenticatedView({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { isAdmin, isOrgAdmin } = useAuthRoles();

    const getNavLinks = (): NavLink[] => {
        const baseLinks: NavLink[] = [
            { href: "/", text: "Dashboard", icon: LayoutDashboard },
            { href: "/patient-browser", text: "Patient Browser", icon: Users },
            { href: "/remote-monitoring", text: "Remote Assessments", icon: Activity },
        ];

        if (isOrgAdmin) {
            return [
                ...baseLinks,
                { href: "/org-admin", text: "Organization Dashboard", icon: Building2 },
            ];
        }
        if (isAdmin && !isOrgAdmin) {
            return [
                ...baseLinks,
                { href: "/admin", text: "Admin", icon: Shield },
            ]
        }
        return baseLinks;
    };

    const navLinks = getNavLinks();
    
    const activeLink = navLinks
        .slice()
        .sort((a, b) => b.href.length - a.href.length)
        .find(link => pathname.startsWith(link.href));
    const activePageLabel = activeLink ? activeLink.text : "Dashboard";

    return (
        <div className="flex h-screen bg-gray-50">
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className={`fixed lg:relative h-full z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <Sidebar 
                    collapsed={isSidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
                    navLinks={navLinks}
                    activePageLabel={activePageLabel}
                />
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-hidden">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">{activePageLabel}</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <AuthComponent />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

// ============================================================================
//  4. The Main Layout Component (Gatekeeper)
// ============================================================================
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [modalContent, setModalContent] = useState<ReactNode | null>(null);
    const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'>('lg');

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