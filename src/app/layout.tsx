import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ui/toast/ToastContainer";
import { BASE_METADATA, ICONS, VIEWPORT } from "@/constants/website";

// ----------------| METADATA |--------------------------
export const metadata: Metadata = {
  manifest: ICONS.MANIFEST,
  title: {
    default: BASE_METADATA.TITLE,
    template: `%s | ${BASE_METADATA.TITLE}`,
  },
  description: BASE_METADATA.DESCRIPTION,
  icons: {
    icon: ICONS.FAVICON,
    shortcut: ICONS.FAVICON_32X32,
    apple: ICONS.APPLE_TOUCH_ICON,
    other: {
      rel: "icon",
      url: ICONS.FAVICON,
    },
  },
};

// ----------------| VIEWPORT |--------------------------
export const viewport: Viewport = {
  themeColor: VIEWPORT.THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
        <ToastProvider>
          {children}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
