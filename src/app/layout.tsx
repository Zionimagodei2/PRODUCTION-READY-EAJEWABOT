import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#08080e",
};

export const metadata: Metadata = {
  title: "EAJE WhatsBot - WhatsApp Automation Dashboard",
  description: "Enterprise WhatsApp automation and growth management platform",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EAJE WhatsBot",
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
  applicationName: "EAJE WhatsBot",
  openGraph: {
    title: "EAJE WhatsBot",
    description: "Enterprise WhatsApp automation and growth management platform",
    type: "website",
    siteName: "EAJE WhatsBot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EAJE WhatsBot" />
        <meta name="application-name" content="EAJE WhatsBot" />
        <meta name="msapplication-TileColor" content="#08080e" />
        <meta name="msapplication-navbutton-color" content="#08080e" />
        
        {/* Mobile Permissions - declarative for web apps */}
        <meta name="permissions" content="notifications,camera,microphone,contacts" />
        
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered:', reg.scope);
                  }).catch(function(err) {
                    console.log('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
