// src/authConfig.ts
import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "745b0eb2-e5dd-4571-98f3-b220f4372cad", // Your Application (client) ID
    authority: "https://login.microsoftonline.com/38e0cb6f-6c14-4c7b-b839-15aefab7386f", // Your Directory (tenant) ID
    redirectUri: "https://animated-orbit-69454pj9xrjvcxvq-3000.app.github.dev" // Or your Codespaces URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Define the permissions your app needs
export const loginRequest = {
  scopes: ["User.Read", "api://745b0eb2-e5dd-4571-98f3-b220f4372cad/access_as_user"] // Use the API scope you defined in "Expose an API"
};