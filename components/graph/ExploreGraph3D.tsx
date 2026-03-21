"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { Tool, Relationship, RelationshipType, CategoryId, getCategoryColor } from "@/lib/types";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";

interface Node3D {
  id: string;
  name: string;
  category: string;
  tagline: string;
  prominent?: boolean;
  tool: Tool;
  // three-forcegraph adds these at runtime
  x?: number;
  y?: number;
  z?: number;
}

interface Link3D {
  source: string | Node3D;
  target: string | Node3D;
  type: RelationshipType;
}

interface Props {
  tools?: Tool[];
  relationships?: Relationship[];
  activeCategories: Set<string>;
  activeRelTypes: Set<RelationshipType>;
  searchQuery: string;
  selectedTool: Tool | null;
  onSelectTool: (tool: Tool | null) => void;
  onWebGLUnavailable?: () => void;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGInstance = any;

export default function ExploreGraph3D({
  tools: toolsProp,
  relationships: relationshipsProp,
  activeCategories,
  activeRelTypes,
  searchQuery,
  selectedTool,
  onSelectTool,
  onWebGLUnavailable,
}: Props) {
  const allTools = toolsProp ?? (toolsData as Tool[]);
  const allRelationships = relationshipsProp ?? (relationshipsData as Relationship[]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<FGInstance>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Check WebGL availability on mount
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglUnavailable(true);
      onWebGLUnavailable?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Amplify scroll delta before OrbitControls sees it — zoomSpeed alone is not
  // reliable across Three.js versions due to delta normalization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dispatching = false;
    const onWheel = (e: WheelEvent) => {
      if (dispatching) return;
      const canvas = el.querySelector("canvas");
      if (!canvas) return;
      e.preventDefault();
      e.stopPropagation();
      dispatching = true;
      canvas.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: false,
          cancelable: true,
          deltaMode: e.deltaMode,
          deltaX: e.deltaX,
          deltaY: e.deltaY * 6,
          deltaZ: e.deltaZ,
          clientX: e.clientX,
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        })
      );
      dispatching = false;
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  const visibleTools = useMemo(
    () => allTools.filter((t) => activeCategories.has(t.category)),
    [activeCategories, allTools]
  );

  const searchMatch = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      allTools
        .filter((t) => t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q))
        .map((t) => t.id)
    );
  }, [searchQuery, allTools]);

  const graphData = useMemo(() => {
    const visibleIds = new Set(visibleTools.map((t) => t.id));
    const nodes: Node3D[] = visibleTools.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      tagline: t.tagline,
      prominent: t.prominent,
      tool: t,
    }));
    const links: Link3D[] = allRelationships
      .filter(
        (r) =>
          visibleIds.has(r.source) &&
          visibleIds.has(r.target) &&
          activeRelTypes.has(r.type as RelationshipType)
      )
      .map((r) => ({
        source: r.source,
        target: r.target,
        type: r.type as RelationshipType,
      }));
    return { nodes, links };
  }, [visibleTools, activeRelTypes, allRelationships]);

  // Apply d3 forces: cap repulsion range + strengthen center pull
  const applyForces = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-60).distanceMax(150);
    fg.d3Force("center")?.strength(0.8);
  }, []);

  // Re-apply forces and reheat whenever graph data changes
  useEffect(() => {
    if (!fgRef.current) return;
    applyForces();
    fgRef.current.d3ReheatSimulation();
  }, [graphData, applyForces]);

  // Configure smooth, fast orbit controls once the simulation first settles
  const controlsReady = useRef(false);
  const onEngineStop = useCallback(() => {
    if (!fgRef.current) return;
    const controls = fgRef.current.controls();
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.zoomSpeed = 3;
      controls.rotateSpeed = 0.7;
    }
    if (!controlsReady.current) {
      controlsReady.current = true;
      // Pull camera closer on first load so the cluster fills the view
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 250 }, undefined, 800);
    }
  }, []);

  // Build Three.js node: colored sphere + always-visible name label
  const nodeThreeObject = useCallback(
    (node: object) => {
      const n = node as Node3D;
      const color = getCategoryColor(n.category as CategoryId);
      const radius = n.prominent ? 6 : 4;
      const isDimmed = !!(searchMatch && !searchMatch.has(n.id));
      const isSelected = selectedTool?.id === n.id;

      const group = new THREE.Group();

      // Sphere
      const hex = parseInt(color.replace("#", ""), 16);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 20, 20),
        new THREE.MeshLambertMaterial({
          color: hex,
          transparent: true,
          opacity: isDimmed ? 0.08 : 0.88,
          emissive: isSelected ? hex : 0x000000,
          emissiveIntensity: isSelected ? 0.4 : 0,
        })
      );
      group.add(sphere);

      // Selection ring
      if (isSelected) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius + 2, 0.5, 8, 32),
          new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
        );
        group.add(ring);
      }

      // Name label — always visible, positioned above sphere
      if (!isDimmed) {
        const label = new SpriteText(n.name);
        label.color = isSelected ? "#ffffff" : "#c8c8ee";
        label.textHeight = radius * 0.52;
        label.fontWeight = "600";
        label.fontFace = "system-ui, -apple-system, sans-serif";
        label.backgroundColor = "rgba(8,8,15,0.65)";
        label.padding = 1.5;
        label.borderRadius = 2;
        (label as unknown as THREE.Object3D).position.y = radius + label.textHeight + 2;
        group.add(label);
      }

      return group;
    },
    [searchMatch, selectedTool]
  );

  const nodeLabel = useCallback((node: object) => {
    const n = node as Node3D;
    return `<div style="background:#0e0e18dd;border:1px solid #7c6bff44;border-radius:6px;padding:6px 10px;max-width:220px">
      <div style="font-size:11px;font-weight:600;color:#e0e0ff;margin-bottom:3px">${n.name}</div>
      <div style="font-size:9px;color:#8888aa;line-height:1.4">${n.tagline}</div>
    </div>`;
  }, []);

  const linkColor = useCallback((link: object) => {
    const l = link as Link3D;
    if (l.type === "integrates-with") return "#7c6bff99";
    if (l.type === "commonly-paired") return "#4a4a7a99";
    return "#5a2a2a88";
  }, []);

  const linkWidth = useCallback((link: object) => {
    const l = link as Link3D;
    return l.type === "integrates-with" ? 1.5 : 0.8;
  }, []);

  const linkDirectionalParticles = useCallback((link: object) => {
    const l = link as Link3D;
    return l.type === "integrates-with" ? 3 : 0;
  }, []);

  const onNodeClick = useCallback(
    (node: object) => {
      const n = node as Node3D;
      onSelectTool(n.tool?.id === selectedTool?.id ? null : n.tool);
    },
    [selectedTool, onSelectTool]
  );

  if (webglUnavailable) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-3"
        style={{ background: "#08080f" }}
      >
        <p style={{ fontSize: 13, color: "#8888aa" }}>
          3D view requires WebGL, which isn&apos;t available in this browser.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 z-10 rounded-lg px-3 py-2.5 space-y-1.5"
        style={{
          background: "#0e0e18cc",
          border: "1px solid #7c6bff22",
          backdropFilter: "blur(8px)",
        }}
      >
        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#7c6bff88] mb-2">
          Connections
        </p>
        {[
          { color: "#7c6bff", label: "Integrates with" },
          { color: "#4a4a7a", label: "Often used together" },
          { color: "#5a2a2a", label: "Competes with" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-px" style={{ background: color, opacity: 0.9 }} />
            <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
          </div>
        ))}
        <p className="text-[9px] text-[var(--text-muted)] mt-1.5 pt-1.5 border-t border-[var(--border)]">
          Drag to rotate · Scroll to zoom · Click for details
        </p>
      </div>

      {dims.width > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={dims.width}
          height={dims.height}
          backgroundColor="#08080f"
          nodeLabel={nodeLabel}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkOpacity={0.6}
          linkDirectionalParticles={linkDirectionalParticles}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={onNodeClick}
          onEngineStop={onEngineStop}
          enableNodeDrag
        />
      )}
    </div>
  );
}
