"use client";

import type React from "react";
import Link from "next/link";
import { Users, BarChart3, ChevronRight, Activity } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Playfair_Display } from "next/font/google";

// Initialize the elegant serif font with multiple weights
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"], // Regular and Bold weights
  style: ["normal", "italic"],
});

// ============================================================================
//  UI Constants
// ============================================================================
const COLORS = {
  primary: '#005fee', // A strong blue
  purple: '#6d28d9',  // A deep purple
  text: '#1f2937',    // Dark gray for text
  textLight: '#4b5563', // Lighter gray for paragraphs
};

// ============================================================================
//  SUB-COMPONENT: Dashboard Card
// ============================================================================
const DashboardCard = ({
  href,
  icon,
  title,
  description,
  buttonText,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
}) => (
  <div className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-200/50 h-full flex flex-col">
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform duration-500 group-hover:scale-125"></div>
    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-500/5 rounded-full transition-transform duration-500 group-hover:scale-125"></div>

    <div className="relative p-8 flex flex-col flex-grow">
      <div className="flex items-center gap-5 mb-5">
        <div className="relative">
          <div className="absolute -inset-1.5 bg-blue-500/10 rounded-2xl transform rotate-3 transition-transform duration-300 group-hover:rotate-6"></div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 shadow-lg group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300 transform -rotate-3">
            {icon}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.text }}>{title}</h2>
        </div>
      </div>
      <p className="text-gray-500 leading-relaxed mb-6 flex-grow font-normal">
        {description}
      </p>
      <Link
        href={href}
        className="mt-auto w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
      >
        {buttonText}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

// ============================================================================
//  MAIN COMPONENT: LandingPage
// ============================================================================
export default function LandingPage() {
  const { accounts } = useMsal();
  const userName = accounts[0]?.name?.split(" ")[0] || "Practitioner";

  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gray-50 ${playfair.className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="relative mb-16">
          <div className="absolute -top-4 -right-8 w-64 h-32 bg-blue-500/5 transform rotate-12 rounded-3xl blur-sm"></div>
          <div className="absolute -bottom-2 -left-4 w-48 h-24 bg-blue-200/10 transform -rotate-6 rounded-2xl"></div>

          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }}></div>
            <div className="relative p-8 md:p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-2 bg-blue-500/10 rounded-3xl transform rotate-2"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500 shadow-2xl transform -rotate-2">
                    <Activity className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: COLORS.text }}>
                    {greeting}, {userName}
                  </h1>
                  <p className="text-2xl md:text-3xl mt-1 font-bold italic bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Welcome to Humant Revisit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>
              Start a Workflow
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-normal">
              Select one of the primary workflows below to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <DashboardCard
              href="/patient-browser"
              icon={<Users className="w-8 h-8 text-white" />}
              title="Patient Browser"
              description="Search, view, and manage all patients. Create comprehensive profiles with detailed medical histories and care plans."
              buttonText="Open Patient Browser"
            />
            <DashboardCard
              href="/remote-monitoring"
              icon={<BarChart3 className="w-8 h-8 text-white" />}
              title="Remote Monitoring"
              description="Track the status of ongoing assessments, review submitted data, and manage patient care workflows with real-time insights."
              buttonText="View Assessments"
            />
          </div>
        </main>
      </div>
    </div>
  );
}