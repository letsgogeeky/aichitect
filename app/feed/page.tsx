import { Suspense } from "react";
import FeedClient from "./FeedClient";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Activity Feed",
  description:
    "What changed in the AI tools ecosystem — health score shifts, star milestones, pricing updates, and more. Updated nightly.",
  path: "/feed",
  ogImageAlt: "AIchitect Activity Feed",
});

export default function Page() {
  return (
    <Suspense>
      <FeedClient />
    </Suspense>
  );
}
