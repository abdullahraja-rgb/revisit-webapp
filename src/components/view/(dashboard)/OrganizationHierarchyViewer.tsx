"use client"
import { useState, useEffect } from "react"
import { useMsal } from "@azure/msal-react"
import { loginRequest } from "@/authConfig"
import { getOrganizationTree, type OrganizationNode } from "@/app/actions/organizationActions"
import { Loader, Building, CornerDownRight } from "lucide-react"
import { useToast } from "@/contexts/ToastContext"

const OrgNode = ({ node, level }: { node: OrganizationNode; level: number }) => {
  return (
    <div style={{ marginLeft: level * 32 }} className="mt-3">
      <div className="group relative">
        <div className="flex items-center bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-indigo-50 p-4 rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 shadow-sm">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-slate-800 text-lg leading-tight">{node.name}</p>
            <p className="text-sm text-slate-500 font-medium">ID: {node.id}</p>
          </div>
          {level > 0 && (
            <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
              <CornerDownRight className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent"></div>
          <div className="pl-6 mt-2">
            {node.children.map((child) => (
              <OrgNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrganizationHierarchyViewer() {
  const { addToast } = useToast()
  const { instance, accounts } = useMsal()
  const [organizationTree, setOrganizationTree] = useState<OrganizationNode[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOrgData = async () => {
      if (accounts.length > 0) {
        setIsLoading(true)
        try {
          const tokenResponse = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] })
          const { tree } = await getOrganizationTree(tokenResponse.accessToken)
          setOrganizationTree(tree)
        } catch (error) {
          addToast({ title: "Error", description: "Could not load organizations.", variant: "destructive" })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadOrgData()
  }, [accounts, instance, addToast])

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-16 text-center border border-slate-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <p className="text-slate-600 font-medium">Loading organization hierarchy...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-t-2xl p-6 mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Organization Hierarchy</h2>
            <p className="text-blue-100 text-sm">View your organization structure and relationships</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm">
        <div className="p-6 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {organizationTree.length > 0 ? (
            organizationTree.map((rootNode) => <OrgNode key={rootNode.id} node={rootNode} level={0} />)
          ) : (
            /* Enhanced empty state with better visual design */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg font-medium">No organizations found</p>
              <p className="text-slate-400 text-sm mt-1">Organizations will appear here once they are created</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}
