import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://aichitect.dev/sitemap.xml",
    host: "https://aichitect.dev",
  };
}
