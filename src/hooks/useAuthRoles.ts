"use client";

import { useMsal } from "@azure/msal-react";

export function useAuthRoles() {
  const { accounts } = useMsal();
  const account = accounts[0];

  const roles = (account?.idTokenClaims?.roles as string[]) || [];

  // Add debugging to see what's in the token
  console.log("=== AUTH DEBUG ===");
  console.log("Account:", account);
  console.log("ID Token Claims:", account?.idTokenClaims);
  console.log("Roles from token:", roles);
  console.log("Raw roles value:", account?.idTokenClaims?.roles);
  console.log("==================");

  const isAdmin = roles.includes('Admin');
  const isClinician = roles.includes('Clinician');
  const isOrgAdmin = roles.includes('orgAdmin'); // Make sure this matches exactly

  console.log("Role checks:", { isAdmin, isClinician, isOrgAdmin });

  return { roles, isAdmin, isClinician, isOrgAdmin };
}