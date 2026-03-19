import tools from "@/data/tools.json";
import stacks from "@/data/stacks.json";
import relationships from "@/data/relationships.json";

export const SITE_URL = "https://aichitect.dev";
export const GITHUB_URL = "https://github.com/letsgogeeky/aichitect";
export const GITHUB_SUGGEST_URL = `${GITHUB_URL}/issues/new?labels=suggested-tool`;

export const TOOL_COUNT = tools.length;
export const CATEGORY_COUNT = new Set(tools.map((t) => t.category)).size;
export const STACK_COUNT = stacks.length;
export const RELATIONSHIP_COUNT = relationships.length;
