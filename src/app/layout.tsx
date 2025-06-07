import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/layout/navigation";
import { GlobalFooter } from "@/components/layout/footer";
import packageJson from "../../package.json";

import { TRPCReactProvider } from "@/trpc/react";
import { AnimatedBackground } from "@/components/layout/animated-background";

export const metadata: Metadata = {
  // TODO: Update metadataBase with production url
  metadataBase: new URL("https://v2-aio.pantelx.com"),
  title: "AIOCatalogs",
  description: packageJson.description,
  keywords: [
    "stremio",
    "addon",
    "catalog",
    "streaming",
    "movies",
    "series",
    "media",
    "entertainment",
    "unified catalog",
    "catalog manager",
    "stremio addons",
    "streaming catalogs",
  ],
  authors: [{ name: packageJson.author, url: "https://github.com/panteLx" }],
  creator: packageJson.author,
  publisher: packageJson.author,
  applicationName: "AIOCatalogs",
  category: "Entertainment",
  classification: "Media Management",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aio.pantelx.com",
    siteName: "AIOCatalogs",
    title: "AIOCatalogs",
    description: packageJson.description,
    images: [
      {
        url: "https://i.imgur.com/zi0Q5da.png",
        width: 1200,
        height: 630,
        alt: "AIOCatalogs",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIOCatalogs",
    description: packageJson.description,
    images: ["https://i.imgur.com/zi0Q5da.png"],
    creator: "@panteLx",
    site: "@panteLx",
  },
  alternates: {
    canonical: "https://aio.pantelx.com",
    languages: {
      "en-US": "https://aio.pantelx.com",
    },
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "AIOCatalogs",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} dark`}>
        <body className="flex min-h-screen flex-col text-foreground antialiased">
          <AnimatedBackground />
          <Navigation />
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <GlobalFooter />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
