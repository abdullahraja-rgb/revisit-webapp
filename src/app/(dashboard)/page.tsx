"use client"
import type React from "react"
import Link from "next/link"
import { Users, BarChart3 } from "lucide-react"
import { useMsal } from "@azure/msal-react"

// A reusable component for the main navigation cards with enhanced styling
const DashboardCard = ({
  href,
  icon,
  title,
  description,
}: { href: string; icon: React.ReactNode; title: string; description: string }) => (
  <Link href={href}>
    <div className="group relative bg-gradient-to-br from-white via-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 hover:-translate-y-2 transition-all duration-500 h-full flex flex-col overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Icon container with enhanced styling */}
      <div className="relative flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">{icon}</div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-grow">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-700 transition-colors duration-300">
          {title}
        </h2>
        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </div>
  </Link>
)

export default function LandingPage() {
  const { accounts } = useMsal()
  const userName = accounts[0]?.name?.split(" ")[0] || "Practitioner"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Header Section with sophisticated gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white p-12 rounded-3xl shadow-2xl mb-12 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full translate-y-32 -translate-x-32"></div>

          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Welcome, {userName}
            </h1>
            <p className="text-xl opacity-90 font-medium max-w-2xl leading-relaxed">
              This is your central hub for managing patient care and monitoring health outcomes with precision and
              efficiency.
            </p>
          </div>
        </div>

        {/* Main Workflow Cards Section */}
        <div className="space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Start a Workflow</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive suite of patient management tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <DashboardCard
              href="/patient-browser"
              icon={<Users className="w-8 h-8" />}
              title="Patient Browser"
              description="Search, view, and manage all patients within your organization. Create comprehensive patient and carer profiles with detailed medical histories and care plans."
            />
            <DashboardCard
              href="/remote-monitoring"
              icon={<BarChart3 className="w-8 h-8" />}
              title="Remote Monitoring"
              description="Track the status of all ongoing assessments, review submitted tasks, and manage patient care workflows with real-time insights and analytics."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
