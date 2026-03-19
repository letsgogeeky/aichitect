import toolsData from "@/data/tools.json";
import slotsData from "@/data/slots.json";

const SLOT_TIME: Record<string, string> = {
  "code-editor": "15 min",
  "cli-agent": "10 min",
  "swe-agent": "30 min",
  "agent-framework": "30 min",
  orchestration: "20 min",
  "model-router": "15 min",
  inference: "20 min",
  "vector-db": "20 min",
  observability: "15 min",
  "design-to-code": "10 min",
  "devops-automation": "15 min",
  "mcp-infra": "15 min",
  "prompt-eval": "20 min",
  docs: "15 min",
  "product-mgmt": "10 min",
  specifications: "10 min",
};

function slotDisplayName(slotId: string): string {
  return slotId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface ChecklistItem {
  step: number;
  slotId: string;
  slotDisplayName: string;
  timeEst: string;
  toolName: string;
  tagline: string;
  link: string | null;
}

export function getChecklistItems(toolIds: string[]): ChecklistItem[] {
  if (toolIds.length === 0) return [];

  type ToolEntry = (typeof toolsData)[0];
  const toolMap = new Map<string, ToolEntry>(toolsData.map((t) => [t.id, t]));
  const slotOrder = slotsData.map((s) => s.id);

  const bySlot = new Map<string, ToolEntry[]>();
  for (const id of toolIds) {
    const tool = toolMap.get(id);
    if (!tool) continue;
    const slot = tool.slot ?? "other";
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot)!.push(tool);
  }

  const orderedSlots = slotOrder.filter((s) => bySlot.has(s));
  for (const slot of bySlot.keys()) {
    if (!orderedSlots.includes(slot)) orderedSlots.push(slot);
  }

  const items: ChecklistItem[] = [];
  let step = 1;

  for (const slotId of orderedSlots) {
    const slotTools = bySlot.get(slotId) ?? [];
    for (const tool of slotTools) {
      items.push({
        step,
        slotId,
        slotDisplayName: slotDisplayName(slotId),
        timeEst: SLOT_TIME[slotId] ?? "15 min",
        toolName: tool.name,
        tagline: tool.tagline,
        link: tool.urls?.website ?? tool.urls?.github ?? null,
      });
      step++;
    }
  }

  return items;
}

export function generateChecklist(toolIds: string[]): string {
  const items = getChecklistItems(toolIds);
  if (items.length === 0) return "";

  const lines: string[] = ["# My AI Stack — Setup Checklist", ""];
  for (const item of items) {
    lines.push(`## ${item.step}. ${item.slotDisplayName} (≈${item.timeEst})`);
    lines.push(`**${item.toolName}** — ${item.tagline}`);
    if (item.link) lines.push(`- [ ] Get started at ${item.link}`);
    lines.push("");
  }

  return lines.join("\n");
}
