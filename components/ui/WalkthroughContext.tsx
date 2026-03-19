"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import WalkthroughOverlay from "./WalkthroughOverlay";

export type TourRoute = "explore" | "stacks" | "builder";
export type StepPlacement = "right" | "left" | "bottom" | "top" | "center";

export interface WalkthroughStep {
  id: string;
  anchor: string | null; // data-tour attribute value; null = center screen
  placement: StepPlacement;
  title: string;
  body: string;
  spotlightPadding?: number;
}

const TOUR_STEPS: Record<TourRoute, WalkthroughStep[]> = {
  explore: [
    {
      id: "welcome",
      anchor: null,
      placement: "center",
      title: "Welcome to AIchitect",
      body: "AI tools are all over the place. This graph maps the full ecosystem — 111 tools across 12 categories — so you can find the right stack without the noise. Let's take 60 seconds to show you around.",
    },
    {
      id: "filter",
      anchor: "filter-panel",
      placement: "right",
      title: "Filter by category or layer",
      body: "Each category is color-coded and grouped by stack layer — where it fits in a real AI system. Toggle layers off to cut noise. The search box finds tools by name or tagline.",
      spotlightPadding: 4,
    },
    {
      id: "canvas",
      anchor: null,
      placement: "center",
      title: "Click any node to explore it",
      body: "Each card is a tool. Click to expand the detail panel on the right — pricing, connections, and which stacks it appears in. Solid lines are integrations; dashed are tools often used together.",
    },
    {
      id: "view-toggle",
      anchor: "view-toggle",
      placement: "left",
      title: "Grid · Layers · 3D",
      body: "Grid shows everything at once. Layers groups tools by stack role — code editor, agent framework, LLM provider. 3D is a force-directed view where clusters emerge naturally.",
      spotlightPadding: 6,
    },
    {
      id: "cta",
      anchor: null,
      placement: "center",
      title: "Ready to build your stack?",
      body: "You've seen the landscape. Head to Stacks for curated picks by use case, or jump into Builder to assemble your own — slot by slot, with integrations mapped live.",
    },
  ],
  stacks: [
    {
      id: "welcome",
      anchor: null,
      placement: "center",
      title: "Curated stacks, not guesswork",
      body: "These are opinionated picks for specific use cases — with tradeoffs documented honestly. Pick one that matches your situation, then customize it in Builder.",
    },
    {
      id: "sidebar",
      anchor: "stacks-sidebar",
      placement: "right",
      title: "Browse by use case",
      body: "Stacks are tagged by complexity and estimated cost. Each card shows which tool categories are covered — color dots at the bottom right. Use the tag filters at the top to narrow down.",
      spotlightPadding: 4,
    },
    {
      id: "graph",
      anchor: "stacks-graph",
      placement: "left",
      title: "See how the tools connect",
      body: "The graph shows the data flow — how code moves through your agent framework to your LLM provider and back. Arrows are labeled with what passes between tools.",
      spotlightPadding: 0,
    },
    {
      id: "builder-cta",
      anchor: "stacks-builder-cta",
      placement: "bottom",
      title: "Load this stack into Builder",
      body: "This pre-fills the Builder with this stack's tools. From there you can swap individual picks, add slots, and share a URL of your exact configuration.",
      spotlightPadding: 6,
    },
  ],
  builder: [
    {
      id: "welcome",
      anchor: null,
      placement: "center",
      title: "Your stack, slot by slot",
      body: "Builder asks a question for each role in your stack. Pick one tool per slot — the graph wires them together live, showing every integration between your chosen tools.",
    },
    {
      id: "slots",
      anchor: "builder-slots",
      placement: "right",
      title: "Answer each question",
      body: "Each slot is a role: code editor, agent framework, LLM provider, and so on. Slots collapse after you pick — the selected tool name shows in the header. Fill required slots first.",
      spotlightPadding: 4,
    },
    {
      id: "health",
      anchor: "builder-health",
      placement: "right",
      title: "Stack health catches gaps",
      body: "Required slots are flagged until filled. Recommendations highlight tools that pair well with your current picks — helping you avoid gaps and conflicts before you ship.",
      spotlightPadding: 6,
    },
    {
      id: "share",
      anchor: "builder-share",
      placement: "bottom",
      title: "Share your exact stack",
      body: "Every tool selection is encoded in the URL. Hit Share Stack to copy a link — send it to a teammate, open it on another device, or use it as a permalink to your configuration.",
      spotlightPadding: 6,
    },
  ],
};

interface WalkthroughContextValue {
  active: boolean;
  exiting: boolean;
  route: TourRoute | null;
  stepIndex: number;
  steps: WalkthroughStep[];
  openWalkthrough: (route: TourRoute) => void;
  next: () => void;
  prev: () => void;
  dismiss: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextValue>({
  active: false,
  exiting: false,
  route: null,
  stepIndex: 0,
  steps: [],
  openWalkthrough: () => {},
  next: () => {},
  prev: () => {},
  dismiss: () => {},
});

export function useWalkthrough() {
  return useContext(WalkthroughContext);
}

const STORAGE_KEY = "aichitect:tour:seen";

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [route, setRoute] = useState<TourRoute | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoTriggered = useRef(false);

  const steps = route ? TOUR_STEPS[route] : [];

  const dismiss = useCallback(() => {
    setExiting(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    dismissTimer.current = setTimeout(() => {
      setActive(false);
      setExiting(false);
      setRoute(null);
      setStepIndex(0);
    }, 200);
  }, []);

  const openWalkthrough = useCallback((r: TourRoute) => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setRoute(r);
    setStepIndex(0);
    setExiting(false);
    setActive(true);
  }, []);

  const next = useCallback(() => {
    const currentSteps = TOUR_STEPS[route ?? "explore"];
    if (stepIndex >= currentSteps.length - 1) {
      dismiss();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [stepIndex, route, dismiss]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Auto-trigger on first visit to /explore
  useEffect(() => {
    if (hasAutoTriggered.current) return;
    if (pathname !== "/explore") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    hasAutoTriggered.current = true;
    const t = setTimeout(() => openWalkthrough("explore"), 900);
    return () => clearTimeout(t);
  }, [pathname, openWalkthrough]);

  return (
    <WalkthroughContext.Provider
      value={{ active, exiting, route, stepIndex, steps, openWalkthrough, next, prev, dismiss }}
    >
      {children}
      {active && <WalkthroughOverlay />}
    </WalkthroughContext.Provider>
  );
}
