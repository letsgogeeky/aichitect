import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL, GITHUB_URL, TOOL_COUNT, CATEGORY_COUNT } from "@/lib/constants";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SuggestToolProvider } from "@/components/ui/SuggestToolContext";
import { WalkthroughProvider } from "@/components/ui/WalkthroughContext";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "AIchitect";
const TITLE = "AIchitect — Cut the noise. Pick your AI stack.";
const DESCRIPTION = `AI tools are all over the place. AIchitect maps the full ecosystem — ${TOOL_COUNT} tools across ${CATEGORY_COUNT} categories — so you can pick the right stack without the noise.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "AI tools",
    "AI stack",
    "developer tools",
    "LLM tools",
    "AI agent frameworks",
    "code editor AI",
    "AI infrastructure",
    "tool comparison",
    "AI ecosystem",
    "stack builder",
    "open source",
  ],
  authors: [{ name: "AIchitect" }],
  creator: "AIchitect",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AIchitect — AI tool landscape map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: SITE_NAME,
              url: SITE_URL,
              description: DESCRIPTION,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                `Interactive AI tool graph with ${TOOL_COUNT} tools`,
                "10 curated AI stacks",
                "Custom stack builder with URL sharing",
                "3D graph visualization",
                "Open source",
              ],
              codeRepository: GITHUB_URL,
              license: "https://opensource.org/licenses/MIT",
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <WalkthroughProvider>
          <SuggestToolProvider>
            {children}
            <Analytics />
            <SpeedInsights />
          </SuggestToolProvider>
        </WalkthroughProvider>
      </body>
    </html>
  );
}
