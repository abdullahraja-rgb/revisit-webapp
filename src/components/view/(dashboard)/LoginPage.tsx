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
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md w-full">
        <div className="flex justify-center items-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            <h1 className="text-3xl font-bold text-gray-800 ml-3">Humant Flow</h1>
        </div>
        <p className="text-gray-600 mb-8">Please log in to access the healthcare dashboard.</p>
        <button onClick={handleLogin} className="btn btn-primary w-full max-w-xs">
          <LogIn className="w-4 h-4 mr-2" />
          Log In with Microsoft
        </button>
      </div>
    </div>
  );
}