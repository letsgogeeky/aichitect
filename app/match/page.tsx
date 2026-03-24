import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import MatchClient from "./MatchClient";

export const metadata: Metadata = pageMeta({
  title: "Find My Stack",
  description:
    "Answer 4 questions and get a curated AI stack recommendation — matched to your role, use case, budget, and priorities.",
  path: "/match",
});

export default function MatchPage() {
  return (
    <Suspense fallback={null}>
      <MatchClient />
    </Suspense>
  );
}
