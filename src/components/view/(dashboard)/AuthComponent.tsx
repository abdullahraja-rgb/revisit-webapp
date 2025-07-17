"use client";

import React from 'react';
import { useMsal, useIsAuthenticated, useAccount } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { LogIn, LogOut } from 'lucide-react';

export default function AuthComponent() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] || {});

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error("Login failed:", e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup({
      mainWindowRedirectUri: "/"
    });
  };

  if (isAuthenticated && account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
            <img 
                src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${account.name?.charAt(0) || 'U'}`} 
                alt="User" 
                className="w-10 h-10 rounded-full"
            />
            <div>
                <p className="font-semibold text-sm text-gray-800">{account.name}</p>
                <p className="text-xs text-gray-500">{account.username}</p>
            </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary p-2" title="Log Out">
            <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleLogin} className="btn btn-primary">
      <LogIn className="w-4 h-4 mr-2" />
      Log In
    </button>
  );
}