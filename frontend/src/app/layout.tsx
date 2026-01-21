import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ConnectionGuard } from "@/components/common/ConnectionGuard";
import { themeScript } from "@/lib/theme-script";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { PwaRegistration } from "@/components/common/PwaRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenNote",
  description: "Privacy-focused research and knowledge management",
  applicationName: "OpenNote",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OpenNote",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/opennote-icon.svg", sizes: "any", type: "image/svg+xml" }],
    apple: [{ url: "/icons/opennote-icon.svg", sizes: "any", type: "image/svg+xml" }],
  },
};

export const viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <I18nProvider>
                <ConnectionGuard>
                  {children}
                  <PwaRegistration />
                  <Toaster />
                </ConnectionGuard>
              </I18nProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
