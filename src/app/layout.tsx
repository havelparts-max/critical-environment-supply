import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import NavBar from "@/components/NavBar";
import "./globals.css";

// Google tag (gtag.js) for Ads/Analytics conversion tracking. Loaded on
// every page via the root layout, per Google Ads' "Option 2: install a
// Google tag in your website code" setup instructions.
const GOOGLE_TAG_ID = "G-PJLVGXQ48Y";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Critical Environment Supply",
  description: "HVAC parts and controls — shop online or sign in as staff.",
  verification: {
    google: "82eo3ubr0UXdpMztRzOYtyhzjHqrW6bIonSit3qIBIw",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TAG_ID}');
          `}
        </Script>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
