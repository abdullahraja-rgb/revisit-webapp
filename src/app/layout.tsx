"use client"; // This line is crucial to make this a Client Component

import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ui/toast/ToastContainer";
import { BASE_METADATA, ICONS, VIEWPORT } from "@/constants/website";

// --- NEW: MSAL Imports ---
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../authConfig"; // Make sure this path is correct

// Create an MSAL instance outside of the component to avoid re-creating it on every render
const msalInstance = new PublicClientApplication(msalConfig);

// Note: The 'export const metadata' and 'export const viewport' are typically
// used in Server Components. In a Client Component layout, you might manage
// the title and meta tags differently, e.g., using a custom hook or component.
// For now, we will leave them, but be aware they may not function as expected
// in a top-level client layout.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* -- ICONS -- */}
        <link rel="icon" href={ICONS.FAVICON} sizes="any" />
        <link rel="icon" href={ICONS.FAVICON_32X32} type="image/png" sizes="32x32" />
        <link rel="icon" href={ICONS.FAVICON_16X16} type="image/png" sizes="16x16" />
        <link
          rel="apple-touch-icon"
          href={ICONS.APPLE_TOUCH_ICON}
          type="image/png"
          sizes="180x180"
        />
        {/* -- MANIFEST -- */}
        <link rel="manifest" href={ICONS.MANIFEST} />
      </head>
      <body className={`antialiased`}>
        {/* Wrap the entire application with the MSAL Provider */}
        <MsalProvider instance={msalInstance}>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </MsalProvider>
      </body>
    </html>
  );
}