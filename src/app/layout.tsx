import type { Metadata } from "next";
import { Geist_Mono, Lato, Cabin } from "next/font/google";
import Script from "next/script";
import NavBar from "@/components/NavBar";
import "./globals.css";

// Google tag (gtag.js) for Ads/Analytics conversion tracking. Loaded on
// every page via the root layout, per Google Ads' "Option 2: install a
// Google tag in your website code" setup instructions.
const GOOGLE_TAG_ID = "G-PJLVGXQ48Y";

// Lato (body) + Cabin (headings) match the type on havelparts.com, the
// user's sister site, so the two storefronts read as one brand family.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const cabin = Cabin({
  variable: "--font-cabin",
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
      className={`${lato.variable} ${cabin.variable} ${geistMono.variable} h-full antialiased`}
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
