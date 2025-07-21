import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "@/authConfig";

/**
 * A utility function to acquire an access token for the currently signed-in user.
 * This should be called from Server Actions before making a request to the backend.
 * @returns The access token string, or null if no user is signed in.
 */
export async function getAccessToken(): Promise<string | null> {
  // Create a new MSAL instance. This is lightweight.
  const msalInstance = new PublicClientApplication(msalConfig);

  // Get all accounts from the browser's cache
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    // No user is signed in
    console.log("getAccessToken: No user is signed in.");
    return null;
  }

  // Prepare the request to get a token for our specific backend API
  const accessTokenRequest = {
    ...loginRequest,
    account: accounts[0] // Use the first signed-in account
  };

  try {
    // Silently acquire the token. This will use the cached token if it's still valid,
    // or refresh it behind the scenes if it's expired.
    const response = await msalInstance.acquireTokenSilent(accessTokenRequest);
    return response.accessToken;
  } catch (error) {
    console.error("Failed to acquire access token silently:", error);
    // If silent acquisition fails, you might need to trigger an interactive login,
    // but for a server action, returning null is often the safest approach.
    return null;
  }
}