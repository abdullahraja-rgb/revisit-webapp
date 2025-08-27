"use client"; // This line is crucial to make this a Client Component

import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ui/toast/ToastContainer";
import { BASE_METADATA, ICONS, VIEWPORT } from "@/constants/website";


import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../authConfig"; 


const msalInstance = new PublicClientApplication(msalConfig);



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