
"use client";

import { useMsal } from "@azure/msal-react";

export function useAuthRoles() {
  const { accounts } = useMsal();
  const account = accounts[0];

  const roles = (account?.idTokenClaims?.roles as string[]) || [];

  const isAdmin = roles.includes('Admin');
  const isClinician = roles.includes('Clinician');

  return { roles, isAdmin, isClinician };
}