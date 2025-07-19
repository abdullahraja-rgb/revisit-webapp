"use client";

import React from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/authConfig";
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => {
    // This triggers the MSAL login popup
    instance.loginPopup(loginRequest).catch(e => {
      console.error("Login failed:", e);
    });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-neutral-100">
      <div className="p-8 max-w-sm w-full text-center">
        {/* Header with Logo and Title */}
        <div className="flex justify-center items-center mb-4">
            <img src="/assets/images/logo/logo.png" alt="Humant Logo" className="h-10 w-auto" />
            <h1 className="text-4xl font-bold text-neutral-800 ml-2"></h1>
        </div>

        {/* Subtitle */}
        <p className="text-neutral-600 mb-8">
          Please log in to access the healthcare dashboard.
        </p>

        {/* Login Button */}
        <button 
          onClick={handleLogin} 
          className="btn btn-primary w-full text-base py-3 justify-center"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Log In with Microsoft
        </button>
      </div>
    </div>
  );
}