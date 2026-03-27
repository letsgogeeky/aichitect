import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Logo from "@/components/ui/Logo";
import { GITHUB_URL } from "@/lib/constants";
import { FindMyStackButton } from "@/components/ui/StackQuizModal";
import { getCounts } from "@/lib/data/counts";
import { LlmPromptSection } from "@/components/ui/LlmPromptSection";
import {
  IconNetwork,
  IconLayers,
  IconSettings2,
  IconGitHub,
  IconCompare,
  IconGenome,
  IconArrowRight,
} from "@/components/icons";

/* ── Decorative SVG previews for each view card ── */

function GraphPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Edges */}
      <line x1="140" y1="80" x2="70" y2="40" stroke="#7c6bff" strokeWidth="1" opacity="0.4" />
      <line x1="140" y1="80" x2="210" y2="40" stroke="#00d4aa" strokeWidth="1" opacity="0.4" />
      <line x1="140" y1="80" x2="70" y2="120" stroke="#ff6b6b" strokeWidth="1" opacity="0.4" />
      <line x1="140" y1="80" x2="210" y2="120" stroke="#26de81" strokeWidth="1" opacity="0.4" />
      <line x1="70" y1="40" x2="210" y2="40" stroke="#7c6bff" strokeWidth="1" opacity="0.2" />
      <line x1="70" y1="120" x2="210" y2="120" stroke="#ff6b6b" strokeWidth="1" opacity="0.2" />
      <line x1="40" y1="80" x2="70" y2="40" stroke="#4ecdc4" strokeWidth="1" opacity="0.3" />
      <line x1="240" y1="80" x2="210" y2="40" stroke="#fd9644" strokeWidth="1" opacity="0.3" />
      {/* Center node */}
      <circle cx="140" cy="80" r="10" fill="#7c6bff" opacity="0.9" />
      <circle cx="140" cy="80" r="14" fill="none" stroke="#7c6bff" strokeWidth="1" opacity="0.3" />
      {/* Surrounding nodes */}
      <circle cx="70" cy="40" r="7" fill="#ff6b6b" opacity="0.85" />
      <circle cx="210" cy="40" r="7" fill="#00d4aa" opacity="0.85" />
      <circle cx="70" cy="120" r="7" fill="#26de81" opacity="0.85" />
      <circle cx="210" cy="120" r="7" fill="#fd9644" opacity="0.85" />
      <circle cx="40" cy="80" r="5" fill="#4ecdc4" opacity="0.7" />
      <circle cx="240" cy="80" r="5" fill="#a29bfe" opacity="0.7" />
      <circle cx="140" cy="20" r="4" fill="#ff9f43" opacity="0.6" />
      <circle cx="140" cy="140" r="4" fill="#74b9ff" opacity="0.6" />
    </svg>
  );
}

function StacksPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lane backgrounds */}
      <rect x="10" y="10" width="260" height="32" rx="4" fill="#7c6bff" opacity="0.07" />
      <rect x="10" y="50" width="260" height="32" rx="4" fill="#00d4aa" opacity="0.07" />
      <rect x="10" y="90" width="260" height="32" rx="4" fill="#ff6b6b" opacity="0.07" />
      <rect x="10" y="130" width="260" height="22" rx="4" fill="#26de81" opacity="0.07" />
      {/* Lane labels */}
      <text x="18" y="30" fill="#7c6bff" fontSize="8" opacity="0.6" fontFamily="monospace">
        Development
      </text>
      <text x="18" y="70" fill="#00d4aa" fontSize="8" opacity="0.6" fontFamily="monospace">
        AI Logic
      </text>
      <text x="18" y="110" fill="#ff6b6b" fontSize="8" opacity="0.6" fontFamily="monospace">
        Models &amp; Infra
      </text>
      <text x="18" y="145" fill="#26de81" fontSize="8" opacity="0.6" fontFamily="monospace">
        Tooling
      </text>
      {/* Tool nodes in lanes */}
      <rect x="60" y="16" width="48" height="20" rx="3" fill="#7c6bff" opacity="0.25" />
      <rect x="116" y="16" width="48" height="20" rx="3" fill="#7c6bff" opacity="0.15" />
      <rect x="172" y="16" width="60" height="20" rx="3" fill="#7c6bff" opacity="0.15" />
      <rect x="60" y="56" width="54" height="20" rx="3" fill="#00d4aa" opacity="0.25" />
      <rect x="122" y="56" width="54" height="20" rx="3" fill="#00d4aa" opacity="0.15" />
      <rect x="60" y="96" width="60" height="20" rx="3" fill="#ff6b6b" opacity="0.25" />
      <rect x="128" y="96" width="48" height="20" rx="3" fill="#ff6b6b" opacity="0.15" />
      <rect x="60" y="134" width="42" height="14" rx="3" fill="#26de81" opacity="0.25" />
      {/* Connecting arrows */}
      <line
        x1="84"
        y1="36"
        x2="84"
        y2="56"
        stroke="#7c6bff"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.4"
      />
      <line
        x1="87"
        y1="76"
        x2="87"
        y2="96"
        stroke="#00d4aa"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.4"
      />
    </svg>
  );
}

function BuilderPreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Slot cards */}
      <rect
        x="10"
        y="20"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#7c6bff"
        strokeWidth="1.5"
      />
      <rect x="10" y="20" width="68" height="3" rx="2" fill="#7c6bff" />
      <rect
        x="106"
        y="20"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#ff6b6b"
        strokeWidth="1.5"
      />
      <rect x="106" y="20" width="68" height="3" rx="2" fill="#ff6b6b" />
      <rect
        x="202"
        y="20"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#00d4aa"
        strokeWidth="1.5"
      />
      <rect x="202" y="20" width="68" height="3" rx="2" fill="#00d4aa" />
      <rect
        x="10"
        y="90"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#26de81"
        strokeWidth="1.5"
      />
      <rect x="10" y="90" width="68" height="3" rx="2" fill="#26de81" />
      <rect
        x="106"
        y="90"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#fd9644"
        strokeWidth="1.5"
      />
      <rect x="106" y="90" width="68" height="3" rx="2" fill="#fd9644" />
      <rect
        x="202"
        y="90"
        width="68"
        height="50"
        rx="5"
        fill="#1c1c28"
        stroke="#4ecdc4"
        strokeWidth="1.5"
      />
      <rect x="202" y="90" width="68" height="3" rx="2" fill="#4ecdc4" />
      {/* Tool name labels */}
      <text x="44" y="52" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        Cursor
      </text>
      <text x="140" y="52" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        LangGraph
      </text>
      <text x="236" y="52" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        GPT-4o
      </text>
      <text x="44" y="122" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        LangSmith
      </text>
      <text x="140" y="122" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        Pinecone
      </text>
      <text x="236" y="122" fill="#f0f0f8" fontSize="7" textAnchor="middle" fontFamily="monospace">
        Vercel
      </text>
      {/* Integration edges */}
      <line
        x1="78"
        y1="45"
        x2="106"
        y2="45"
        stroke="#7c6bff"
        strokeWidth="1"
        opacity="0.5"
        strokeDasharray="3 2"
      />
      <line
        x1="174"
        y1="45"
        x2="202"
        y2="45"
        stroke="#ff6b6b"
        strokeWidth="1"
        opacity="0.5"
        strokeDasharray="3 2"
      />
      <line
        x1="78"
        y1="115"
        x2="106"
        y2="115"
        stroke="#26de81"
        strokeWidth="1"
        opacity="0.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}

function ComparePreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left card */}
      <rect
        x="6"
        y="8"
        width="118"
        height="144"
        rx="6"
        fill="#0d0d16"
        stroke="#7c6bff"
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <rect x="6" y="8" width="118" height="3" rx="2" fill="#7c6bff" opacity="0.85" />
      {/* Right card */}
      <rect
        x="156"
        y="8"
        width="118"
        height="144"
        rx="6"
        fill="#0d0d16"
        stroke="#00d4aa"
        strokeWidth="1"
        strokeOpacity="0.35"
      />
      <rect x="156" y="8" width="118" height="3" rx="2" fill="#00d4aa" opacity="0.85" />
      {/* VS bubble */}
      <circle cx="140" cy="80" r="13" fill="#111118" stroke="#1e1e2e" strokeWidth="1.5" />
      <text
        x="140"
        y="84"
        textAnchor="middle"
        fill="#555577"
        fontSize="7"
        fontWeight="600"
        fontFamily="monospace"
      >
        vs
      </text>
      {/* Left tool name bar */}
      <rect x="14" y="17" width="56" height="8" rx="2" fill="#7c6bff" opacity="0.22" />
      <rect x="14" y="17" width="36" height="8" rx="2" fill="#7c6bff" opacity="0.12" />
      {/* Right tool name bar */}
      <rect x="164" y="17" width="56" height="8" rx="2" fill="#00d4aa" opacity="0.22" />
      <rect x="164" y="17" width="44" height="8" rx="2" fill="#00d4aa" opacity="0.12" />
      {/* Row labels */}
      <text x="14" y="37" fill="#555577" fontSize="6" fontFamily="monospace">
        Category
      </text>
      <text x="164" y="37" fill="#555577" fontSize="6" fontFamily="monospace">
        Category
      </text>
      <text x="14" y="57" fill="#555577" fontSize="6" fontFamily="monospace">
        Type
      </text>
      <text x="164" y="57" fill="#555577" fontSize="6" fontFamily="monospace">
        Type
      </text>
      <text x="14" y="77" fill="#555577" fontSize="6" fontFamily="monospace">
        Free tier
      </text>
      <text x="164" y="77" fill="#555577" fontSize="6" fontFamily="monospace">
        Free tier
      </text>
      <text x="14" y="97" fill="#555577" fontSize="6" fontFamily="monospace">
        Stars
      </text>
      <text x="164" y="97" fill="#555577" fontSize="6" fontFamily="monospace">
        Stars
      </text>
      {/* Row 1: Category pills */}
      <rect x="14" y="40" width="48" height="7" rx="2" fill="#7c6bff" opacity="0.2" />
      <rect x="164" y="40" width="54" height="7" rx="2" fill="#00d4aa" opacity="0.2" />
      {/* Row 2: Type tags */}
      <rect x="14" y="60" width="42" height="7" rx="2" fill="#26de81" opacity="0.2" />
      <rect x="164" y="60" width="48" height="7" rx="2" fill="#4ecdc4" opacity="0.2" />
      {/* Row 3: Free tier ✓ / ✗ */}
      <text x="14" y="90" fill="#26de81" fontSize="10" fontFamily="monospace" opacity="0.9">
        ✓
      </text>
      <text x="164" y="90" fill="#ff6b6b" fontSize="10" fontFamily="monospace" opacity="0.9">
        ✗
      </text>
      {/* Row 4: Stars bars */}
      <rect x="14" y="100" width="88" height="5" rx="2" fill="#7c6bff" opacity="0.1" />
      <rect x="14" y="100" width="66" height="5" rx="2" fill="#7c6bff" opacity="0.4" />
      <rect x="164" y="100" width="88" height="5" rx="2" fill="#00d4aa" opacity="0.1" />
      <rect x="164" y="100" width="36" height="5" rx="2" fill="#00d4aa" opacity="0.4" />
      {/* Shared connections section */}
      <text x="14" y="118" fill="#555577" fontSize="6" fontFamily="monospace">
        Shared connections
      </text>
      {/* Left shared dots */}
      <circle cx="18" cy="132" r="5" fill="#ff6b6b" opacity="0.4" />
      <circle cx="30" cy="132" r="5" fill="#26de81" opacity="0.4" />
      <circle cx="42" cy="132" r="5" fill="#fd9644" opacity="0.4" />
      {/* Right shared dots (mirrored) */}
      <circle cx="262" cy="132" r="5" fill="#ff6b6b" opacity="0.4" />
      <circle cx="250" cy="132" r="5" fill="#26de81" opacity="0.4" />
      <circle cx="238" cy="132" r="5" fill="#fd9644" opacity="0.4" />
      {/* Dashed lines connecting shared */}
      <line
        x1="23"
        y1="132"
        x2="257"
        y2="132"
        stroke="#ff6b6b"
        strokeWidth="0.75"
        strokeDasharray="3 3"
        opacity="0.25"
      />
      <line
        x1="35"
        y1="132"
        x2="245"
        y2="132"
        stroke="#26de81"
        strokeWidth="0.75"
        strokeDasharray="3 3"
        opacity="0.25"
      />
      <line
        x1="47"
        y1="132"
        x2="233"
        y2="132"
        stroke="#fd9644"
        strokeWidth="0.75"
        strokeDasharray="3 3"
        opacity="0.25"
      />
      {/* Extra unique-to-each dots */}
      <circle cx="56" cy="132" r="4" fill="#7c6bff" opacity="0.25" />
      <circle cx="66" cy="132" r="4" fill="#a29bfe" opacity="0.2" />
      <circle cx="214" cy="132" r="4" fill="#4ecdc4" opacity="0.25" />
      <circle cx="224" cy="132" r="4" fill="#00d4aa" opacity="0.2" />
      {/* Row dividers */}
      <line x1="14" y1="34" x2="110" y2="34" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="164" y1="34" x2="260" y2="34" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="14" y1="54" x2="110" y2="54" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="164" y1="54" x2="260" y2="54" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="14" y1="74" x2="110" y2="74" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="164" y1="74" x2="260" y2="74" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="14" y1="94" x2="110" y2="94" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="164" y1="94" x2="260" y2="94" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="14" y1="114" x2="110" y2="114" stroke="#1e1e2e" strokeWidth="0.5" />
      <line x1="164" y1="114" x2="260" y2="114" stroke="#1e1e2e" strokeWidth="0.5" />
    </svg>
  );
}

function GenomePreview() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fitness gauge circle */}
      <circle cx="60" cy="80" r="38" stroke="#1e1e2e" strokeWidth="7" fill="none" />
      <circle
        cx="60"
        cy="80"
        r="38"
        stroke="#26de81"
        strokeWidth="7"
        fill="none"
        strokeDasharray="180 239"
        strokeLinecap="round"
        transform="rotate(-90 60 80)"
        opacity="0.9"
      />
      <text
        x="60"
        y="77"
        textAnchor="middle"
        fill="#f0f0f8"
        fontSize="16"
        fontWeight="700"
        fontFamily="monospace"
      >
        78
      </text>
      <text x="60" y="90" textAnchor="middle" fill="#555577" fontSize="7" fontFamily="monospace">
        / 100
      </text>
      <rect x="36" y="126" width="48" height="10" rx="5" fill="#26de81" opacity="0.2" />
      <text
        x="60"
        y="134"
        textAnchor="middle"
        fill="#26de81"
        fontSize="7"
        fontWeight="600"
        fontFamily="monospace"
      >
        Cutting-Edge
      </text>

      {/* Slot grid on the right */}
      {[
        { x: 118, y: 10, color: "#7c6bff", label: "code editor", filled: true },
        { x: 194, y: 10, color: "#ff6b6b", label: "agent", filled: true },
        { x: 118, y: 48, color: "#26de81", label: "framework", filled: true },
        { x: 194, y: 48, color: "#00d4aa", label: "inference", filled: true },
        { x: 118, y: 86, color: "#4ecdc4", label: "vector db", filled: true },
        { x: 194, y: 86, color: "#fd9644", label: "observability", filled: false },
        { x: 118, y: 124, color: "#a29bfe", label: "mcp", filled: false },
        { x: 194, y: 124, color: "#555577", label: "eval", filled: false },
      ].map(({ x, y, color, label, filled }) => (
        <g key={label}>
          <rect
            x={x}
            y={y}
            width="68"
            height="32"
            rx="5"
            fill={filled ? color + "15" : "#0e0e18"}
            stroke={filled ? color + "44" : "#1e1e2e"}
          />
          <circle cx={x + 9} cy={y + 10} r="3" fill={color} opacity={filled ? 0.9 : 0.3} />
          <rect
            x={x + 7}
            y={y + 18}
            width={filled ? 42 : 28}
            height="6"
            rx="2"
            fill={color}
            opacity={filled ? 0.5 : 0.15}
          />
        </g>
      ))}
    </svg>
  );
}

export default async function LandingPage() {
  const counts = await getCounts();
  const { toolCount, categoryCount, stackCount } = counts;

  const VIEWS = [
    {
      href: "/stacks",
      label: "Stacks",
      tagline: `${stackCount} stacks with rejection reasoning`,
      description:
        "Each stack lists what was considered and rejected — and why. Plus kill conditions for when to move on and where to graduate next.",
      Icon: IconLayers,
      accent: "#00d4aa",
      Preview: StacksPreview,
    },
    {
      href: "/explore",
      label: "Graph",
      tagline: "Explore the full AI ecosystem",
      description: `Map ${toolCount} tools across ${categoryCount} categories. Browse relationships, filter by category, and explore in 2D or 3D.`,
      Icon: IconNetwork,
      accent: "#7c6bff",
      Preview: GraphPreview,
    },
    {
      href: "/builder",
      label: "Builder",
      tagline: "Design your own stack",
      description:
        "Pick one tool per slot and watch your stack wire together. Share it with a single URL.",
      Icon: IconSettings2,
      accent: "#ff6b6b",
      Preview: BuilderPreview,
    },
    {
      href: "/compare",
      label: "Compare",
      tagline: "Side-by-side tool analysis",
      description:
        "Pick any two tools and see pricing, type, GitHub stars, shared connections, and unique integrations in one view.",
      Icon: IconCompare,
      accent: "#fd9644",
      Preview: ComparePreview,
    },
    {
      href: "/genome",
      label: "Genome",
      tagline: "Is your stack production-ready?",
      description:
        "Paste your package.json or requirements.txt and get a fitness score, slot coverage analysis, and an adversarial challenge of every tool choice.",
      Icon: IconGenome,
      accent: "#26de81",
      Preview: GenomePreview,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#f0f0f8",
        fontFamily: "Inter, sans-serif",
        overflowX: "hidden",
      }}
    >
      <Navbar counts={counts} />

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 100px",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse 900px 500px at 50% 0%, #7c6bff14 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Decorative dots */}
        {[
          { x: "8%", y: "20%", color: "#7c6bff", r: 5 },
          { x: "15%", y: "65%", color: "#ff6b6b", r: 4 },
          { x: "85%", y: "20%", color: "#00d4aa", r: 5 },
          { x: "92%", y: "60%", color: "#26de81", r: 4 },
          { x: "50%", y: "92%", color: "#4ecdc4", r: 3 },
        ].map(({ x, y, color, r }, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: color,
              opacity: 0.4,
              boxShadow: `0 0 ${r * 5}px ${color}66`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* OSS badge */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 14px",
            borderRadius: 100,
            background: "#26de8112",
            border: "1px solid #26de8133",
            color: "#26de81",
            fontSize: 12,
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: 32,
            position: "relative",
          }}
        >
          <IconGitHub />
          Open Source — star us on GitHub
        </a>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.08,
            maxWidth: 780,
            marginBottom: 24,
            position: "relative",
          }}
        >
          AI tools are all over the place.
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Picking the right stack shouldn&apos;t be.
          </span>
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: "clamp(15px, 2vw, 19px)",
            color: "#8888aa",
            maxWidth: 560,
            lineHeight: 1.65,
            marginBottom: 44,
            position: "relative",
          }}
        >
          Not just a map — an opinion. {toolCount} tools across {categoryCount} categories, with the
          reasoning behind every recommendation: what to pick, what to reject, and when to move on.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <FindMyStackButton />
            <Link
              href="/stacks"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0 24px",
                height: 46,
                borderRadius: 10,
                background: "#1c1c28",
                border: "1px solid #2a2a3a",
                color: "#c0c0d8",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Browse Stacks
            </Link>
          </div>
          <p style={{ fontSize: 12, color: "#444466", margin: 0 }}>
            or{" "}
            <Link
              href="/explore"
              style={{ color: "#555577", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              explore the full graph
            </Link>
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 60,
            position: "relative",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { value: `${toolCount}`, label: "tools mapped", color: "#7c6bff" },
            { value: `${categoryCount}`, label: "categories", color: "#00d4aa" },
            { value: `${stackCount}`, label: "curated stacks", color: "#26de81" },
            { value: "100%", label: "open source", color: "#ff6b6b" },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: -0.5 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: "#555577", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <LlmPromptSection />

      {/* ── Decision framework callouts ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 60px",
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#555577",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            Not a directory. A decision tool.
          </p>
          <h2
            style={{
              fontSize: "clamp(22px, 3.5vw, 32px)",
              fontWeight: 700,
              letterSpacing: -0.5,
              color: "#f0f0f8",
              margin: 0,
            }}
          >
            Every stack has opinions baked in
          </h2>
        </div>

        {/* 3-column callouts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 56,
          }}
        >
          {/* Rejection reasoning */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "#ff6b6b15",
                border: "1px solid #ff6b6b33",
                color: "#ff6b6b",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              ✕ Not in this stack
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f8",
                marginBottom: 8,
              }}
            >
              Rejection reasoning
            </h3>
            <p style={{ fontSize: 13, color: "#6666aa", lineHeight: 1.65, marginBottom: 20 }}>
              Every stack tells you what was considered and explicitly ruled out — and why. No other
              tool in this space does this.
            </p>
            <div
              style={{
                background: "#0e0e18",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: "#ff6b6b", fontWeight: 500 }}>LangGraph</span>
              <span style={{ color: "#444466" }}> — not in </span>
              <span style={{ color: "#8888aa" }}>Indie Hacker</span>
              <br />
              <span style={{ color: "#555577", fontStyle: "italic" }}>
                &ldquo;Orchestration overhead kills solo velocity at this stage&rdquo;
              </span>
            </div>
          </div>

          {/* Kill conditions */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "#fd964415",
                border: "1px solid #fd964433",
                color: "#fd9644",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              ⚡ When to move on
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f8",
                marginBottom: 8,
              }}
            >
              Kill conditions
            </h3>
            <p style={{ fontSize: 13, color: "#6666aa", lineHeight: 1.65, marginBottom: 20 }}>
              Each stack defines exactly when it stops being the right choice. Know your exit before
              you&apos;re stuck.
            </p>
            <div
              style={{
                background: "#0e0e18",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: "#fd9644", fontWeight: 500 }}>Indie Hacker stack</span>
              <br />
              <span style={{ color: "#555577", fontStyle: "italic" }}>
                &ldquo;Team grows beyond 3 engineers&rdquo;
              </span>
            </div>
          </div>

          {/* Graduation paths */}
          <div
            style={{
              background: "#111118",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                background: "#26de8115",
                border: "1px solid #26de8133",
                color: "#26de81",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              → Graduation path
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f8",
                marginBottom: 8,
              }}
            >
              Scale-aware progression
            </h3>
            <p style={{ fontSize: 13, color: "#6666aa", lineHeight: 1.65, marginBottom: 20 }}>
              When you hit a kill condition, the next stack is already mapped. Your progression arc
              is visible from the start.
            </p>
            <div
              style={{
                background: "#0e0e18",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 12,
                lineHeight: 1.6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ color: "#8888aa" }}>Indie Hacker</span>
              <span style={{ color: "#26de81" }}>→</span>
              <span style={{ color: "#8888aa" }}>LLM Startup</span>
              <span style={{ color: "#26de81" }}>→</span>
              <span style={{ color: "#8888aa" }}>Production RAG</span>
            </div>
          </div>
        </div>

        {/* 5 decision clusters */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#444466", marginBottom: 16 }}>
            25 stacks organized across 5 decision clusters
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Build", count: 6, color: "#7c6bff" },
              { label: "Automate", count: 5, color: "#ff6b6b" },
              { label: "Ship & Harden", count: 6, color: "#fd9644" },
              { label: "Understand", count: 4, color: "#00d4aa" },
              { label: "Comply & Restrict", count: 4, color: "#26de81" },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                  fontSize: 12,
                  fontWeight: 500,
                  color,
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: 10,
                    color: `${color}88`,
                    background: `${color}18`,
                    borderRadius: 10,
                    padding: "1px 6px",
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Genome feature callout ── */}
      <section
        style={{
          borderTop: "1px solid #26de8118",
          borderBottom: "1px solid #26de8118",
          background: "linear-gradient(180deg, #0d120f 0%, #0a0a0f 100%)",
          margin: "0 0 0 0",
          padding: "72px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse 800px 400px at 20% 50%, #26de8109 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Left — copy */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "4px 12px",
                borderRadius: 20,
                background: "#26de8112",
                border: "1px solid #26de8133",
                color: "#26de81",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                marginBottom: 24,
              }}
            >
              <IconGenome />
              Genome
            </div>

            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 42px)",
                fontWeight: 800,
                letterSpacing: -1,
                lineHeight: 1.1,
                color: "#f0f0f8",
                marginBottom: 16,
              }}
            >
              You already have a stack.
              <br />
              <span style={{ color: "#26de81" }}>Is it any good?</span>
            </h2>

            <p
              style={{
                fontSize: 15,
                color: "#6666aa",
                lineHeight: 1.7,
                marginBottom: 32,
                maxWidth: 440,
              }}
            >
              Paste your <code style={{ color: "#8888aa", fontSize: 13 }}>package.json</code> or{" "}
              <code style={{ color: "#8888aa", fontSize: 13 }}>requirements.txt</code> and get a
              fitness score for your AI stack — which slots are covered, which are missing, and
              where you&apos;re leaving performance on the table.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
              {[
                { label: "Fitness score 0–100", color: "#26de81" },
                { label: "Slot coverage analysis", color: "#00d4aa" },
                { label: "Roast mode", color: "#ff6b6b" },
                { label: "Challenge mode", color: "#7c6bff" },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    fontSize: 12,
                    fontWeight: 500,
                    color,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            <Link
              href="/genome"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0 28px",
                height: 50,
                borderRadius: 12,
                background: "#26de81",
                color: "#0a0a0f",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                letterSpacing: -0.2,
              }}
            >
              Scan my stack
              <IconArrowRight />
            </Link>
          </div>

          {/* Right — static Genome results mockup */}
          <div
            style={{
              background: "#0e0e18",
              border: "1px solid #26de8122",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 0 60px #26de8109",
            }}
          >
            {/* Mock header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #1e1e2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "#555577" }}>6 tools in your genome</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#26de81",
                  background: "#26de8115",
                  border: "1px solid #26de8133",
                  borderRadius: 10,
                  padding: "2px 8px",
                }}
              >
                Production-Grade
              </span>
            </div>

            {/* Mock body */}
            <div style={{ padding: "20px 20px 24px", display: "flex", gap: 20 }}>
              {/* Gauge */}
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                  <circle cx="44" cy="44" r="34" stroke="#1e1e2e" strokeWidth="7" fill="none" />
                  <circle
                    cx="44"
                    cy="44"
                    r="34"
                    stroke="#26de81"
                    strokeWidth="7"
                    fill="none"
                    strokeDasharray="155 214"
                    strokeLinecap="round"
                    transform="rotate(-90 44 44)"
                    opacity="0.9"
                  />
                  <text
                    x="44"
                    y="40"
                    textAnchor="middle"
                    fill="#f0f0f8"
                    fontSize="15"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    78
                  </text>
                  <text
                    x="44"
                    y="52"
                    textAnchor="middle"
                    fill="#555577"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    / 100
                  </text>
                </svg>
                <span
                  style={{ fontSize: 10, color: "#555577", textAlign: "center", lineHeight: 1.4 }}
                >
                  6 of 8<br />
                  slots filled
                </span>
              </div>

              {/* Slots + panels */}
              <div
                style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}
              >
                {/* Filled slots */}
                {[
                  { slot: "Code Editor", tool: "Cursor", color: "#7c6bff" },
                  { slot: "Agent Framework", tool: "LangGraph", color: "#26de81" },
                  { slot: "LLM Provider", tool: "Claude API", color: "#00d4aa" },
                  { slot: "Observability", tool: "Langfuse", color: "#fd9644" },
                ].map(({ slot, tool, color }) => (
                  <div
                    key={slot}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 7,
                      background: `${color}0d`,
                      border: `1px solid ${color}28`,
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#555577" }}>{slot}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color }}>{tool} ✓</span>
                  </div>
                ))}
                {/* Missing slots */}
                {[
                  { slot: "Eval Layer", suggest: "PromptFoo" },
                  { slot: "Vector DB", suggest: "Qdrant" },
                ].map(({ slot, suggest }) => (
                  <div
                    key={slot}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 7,
                      background: "#ffffff04",
                      border: "1px solid #1e1e2e",
                    }}
                  >
                    <span style={{ fontSize: 10, color: "#333355" }}>{slot}</span>
                    <span style={{ fontSize: 10, color: "#333355" }}>→ {suggest}</span>
                  </div>
                ))}

                {/* Roast line */}
                <div
                  style={{
                    marginTop: 2,
                    padding: "8px 10px",
                    borderRadius: 7,
                    background: "#ff6b6b08",
                    border: "1px solid #ff6b6b22",
                    borderLeft: "2px solid #ff6b6b55",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#ff6b6b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    🔥 Roast
                  </span>
                  <p style={{ margin: "4px 0 0", fontSize: 10, color: "#8888aa", lineHeight: 1.5 }}>
                    No eval layer. You&apos;re shipping vibes to production.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Path hint ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 40px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12, color: "#444466", flexShrink: 0 }}>
          Not sure where to start?
        </span>
        <Link
          href="/stacks"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 8,
            background: "#00d4aa12",
            border: "1px solid #00d4aa33",
            color: "#00d4aa",
            fontSize: 12,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <IconLayers />
          I&apos;m new — show me curated stacks
        </Link>
        <Link
          href="/builder"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 8,
            background: "#ff6b6b12",
            border: "1px solid #ff6b6b33",
            color: "#ff6b6b",
            fontSize: 12,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <IconSettings2 />I know what I need — let me build
        </Link>
      </div>

      {/* ── View cards ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 120px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {VIEWS.map(({ href, label, tagline, description, Icon, accent, Preview }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 14,
              background: "#111118",
              border: `1px solid #1e1e2e`,
              overflow: "hidden",
              textDecoration: "none",
              transition: "border-color 200ms",
            }}
          >
            {/* Preview pane */}
            <div
              style={{
                height: 180,
                background: "#0d0d16",
                borderBottom: `1px solid #1e1e2e`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Subtle glow behind preview */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `radial-gradient(ellipse 300px 200px at 50% 50%, ${accent}0a 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
              <div style={{ width: "80%", height: "80%", position: "relative" }}>
                <Preview />
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding: "20px 24px 24px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: `${accent}18`,
                  border: `1px solid ${accent}33`,
                  color: accent,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                <Icon />
                {label}
              </div>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#f0f0f8",
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {tagline}
              </p>
              <p style={{ fontSize: 13, color: "#6666aa", lineHeight: 1.6, margin: 0 }}>
                {description}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 16,
                  fontSize: 12,
                  fontWeight: 500,
                  color: accent,
                }}
              >
                Open {label}
                <IconArrowRight />
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ── OSS / CTA banner ── */}
      <section
        style={{
          maxWidth: 780,
          margin: "0 auto 100px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #7c6bff0d, #00d4aa0d)",
            border: "1px solid #7c6bff22",
            padding: "48px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(ellipse 600px 300px at 50% 50%, #7c6bff08 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <Logo size={48} id="oss-logo-g" />
          </div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: "#f0f0f8",
              marginBottom: 12,
              position: "relative",
            }}
          >
            Built in the open
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#6666aa",
              maxWidth: 480,
              margin: "0 auto 28px",
              lineHeight: 1.7,
              position: "relative",
            }}
          >
            AIchitect is fully open source. Browse the code, open issues, suggest tools, or
            contribute new stacks. The more the merrier.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 24px",
              height: 42,
              borderRadius: 8,
              background: "#f0f0f8",
              color: "#0a0a0f",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              position: "relative",
            }}
          >
            <IconGitHub />
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid #1e1e2e",
          padding: "32px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={20} id="footer-logo-g" />
          <span style={{ fontSize: 13, color: "#444466" }}>AIchitect</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Graph", href: "/explore" },
            { label: "Stacks", href: "/stacks" },
            { label: "Builder", href: "/builder" },
            { label: "Compare", href: "/compare" },
            { label: "Genome", href: "/genome" },
            { label: "GitHub", href: GITHUB_URL, external: true },
          ].map(({ label, href, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#444466", textDecoration: "none" }}
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                style={{ fontSize: 12, color: "#444466", textDecoration: "none" }}
              >
                {label}
              </Link>
            )
          )}
        </div>
        <span style={{ fontSize: 12, color: "#333355" }}>aichitect.dev</span>
      </footer>
    </div>
  );
}
