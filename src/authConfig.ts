// src/authConfig.ts
import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "745b0eb2-e5dd-4571-98f3-b220f4372cad", 
    authority: "https://login.microsoftonline.com/38e0cb6f-6c14-4c7b-b839-15aefab7386f", 
    redirectUri: "http://localhost:3000" // Or your Codespaces URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// --- THIS IS THE FIX ---
// We are removing the "User.Read" scope to make the request unambiguous.
// The app will now ONLY ask for a token that is valid for your backend API.
export const loginRequest = {
  scopes: [
    "api://745b0eb2-e5dd-4571-98f3-b220f4372cad/access_as_user" 
  ]
};
