import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

interface PageMetaOptions {
  title: string;
  description: string;
  /** Route path, e.g. "/stacks". Appended to SITE_URL for canonical + OG url. */
  path: string;
  /** Absolute OG image path. Defaults to "/opengraph-image". */
  ogImage?: string;
  /** Alt text for the OG image. Defaults to title. */
  ogImageAlt?: string;
}

export function pageMeta({
  title,
  description,
  path,
  ogImage = "/opengraph-image",
  ogImageAlt,
}: PageMetaOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const alt = ogImageAlt ?? title;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
