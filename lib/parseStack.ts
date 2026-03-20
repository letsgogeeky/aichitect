import type { Tool } from "./types";

/**
 * A project snapshot — the raw file contents we can extract detection signals from.
 * All fields are optional; the parser runs only on whichever are provided.
 *
 * Phase 1: user pastes file contents in the UI (fully client-side, no backend).
 * Phase 2: GitHub URL → edge function fetches these automatically.
 */
export interface ProjectSnapshot {
  packageJson?: string; // raw JSON string (package.json)
  requirementsTxt?: string; // raw plaintext (requirements.txt or requirements/*.txt)
  pyprojectToml?: string; // raw TOML string (pyproject.toml)
  envExample?: string; // raw plaintext (.env.example / .env.local.example)
  dockerCompose?: string; // raw YAML string (docker-compose.yml / compose.yaml)
  fileTree?: string[]; // list of relative file paths (for config_file matching)
}

/** Which detection strategy fired for a given tool. */
export type DetectionSource = "npm" | "pip" | "env_var" | "config_file";

/**
 * Confidence is derived from the best source type that fired:
 *   high   — npm or pip package found (definitive code dependency)
 *   medium — env var found only (tool is used but SDK may be abstracted)
 *   low    — config file found only (tool is configured but may be unused)
 */
export type DetectionConfidence = "high" | "medium" | "low";

export interface DetectionResult {
  toolId: string;
  sources: DetectionSource[];
  confidence: DetectionConfidence;
}

// ---------------------------------------------------------------------------
// Internal parsers — each returns a normalised Set of detected identifiers
// ---------------------------------------------------------------------------

function parseNpmPackages(packageJson: string): Set<string> {
  try {
    const parsed = JSON.parse(packageJson) as Record<string, Record<string, string>>;
    const all = {
      ...parsed.dependencies,
      ...parsed.devDependencies,
      ...parsed.peerDependencies,
    };
    return new Set(Object.keys(all));
  } catch {
    return new Set();
  }
}

function parsePipPackages(requirementsTxt: string): Set<string> {
  const packages = new Set<string>();
  for (const raw of requirementsTxt.split("\n")) {
    const line = raw.trim();
    // Skip comments, blank lines, flags (-r, -c, --index-url, etc.)
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    // Strip version specifiers, extras, and markers: pkg>=1.0,<2 [extra] ; python_version>="3.8"
    const name = line
      .split(/[>=<!~\[;\s]/)[0]
      .toLowerCase()
      .replace(/_/g, "-");
    if (name) packages.add(name);
  }
  return packages;
}

function parsePyprojectPackages(pyprojectToml: string): Set<string> {
  const packages = new Set<string>();

  // Extract the content of known dependency table sections
  // Handles: [project] dependencies, [tool.poetry.dependencies], [tool.poetry.dev-dependencies]
  const sectionPatterns = [
    /\[project\]([\s\S]*?)(?=\n\[|$)/,
    /\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
    /\[tool\.poetry\.dev-dependencies\]([\s\S]*?)(?=\n\[|$)/,
    /\[tool\.poetry\.group\.\w+\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
  ];

  for (const pattern of sectionPatterns) {
    const section = pyprojectToml.match(pattern)?.[1] ?? "";

    // PEP 508 inline array: dependencies = ["package>=1.0", ...]
    for (const match of section.matchAll(/"([a-zA-Z0-9][a-zA-Z0-9_\-]*)[^"]*"/g)) {
      const name = match[1].toLowerCase().replace(/_/g, "-");
      if (!["python"].includes(name)) packages.add(name);
    }

    // Poetry table style: package = "^1.0" or package = {version = "..."}
    for (const match of section.matchAll(/^([a-zA-Z0-9][a-zA-Z0-9_\-]*)\s*=/gm)) {
      const name = match[1].toLowerCase().replace(/_/g, "-");
      if (!["python", "python-dotenv"].includes(name)) packages.add(name);
    }
  }

  return packages;
}

function parseEnvKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    // Matches: KEY=value  |  KEY = value  |  export KEY=value  |  KEY: value (compose)
    const match = line.match(/^(?:export\s+)?([A-Z][A-Z0-9_]*)[\s=:]/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Given a project snapshot and the full tool list (with aliases populated),
 * returns every tool that was detected along with which signals fired.
 *
 * Tools without an `aliases` field are never auto-detected (manual-only).
 */
export function detectTools(snapshot: ProjectSnapshot, tools: Tool[]): DetectionResult[] {
  const npmPackages = snapshot.packageJson
    ? parseNpmPackages(snapshot.packageJson)
    : new Set<string>();

  const pipPackages = new Set<string>([
    ...(snapshot.requirementsTxt ? parsePipPackages(snapshot.requirementsTxt) : []),
    ...(snapshot.pyprojectToml ? parsePyprojectPackages(snapshot.pyprojectToml) : []),
  ]);

  const envKeys = new Set<string>([
    ...(snapshot.envExample ? parseEnvKeys(snapshot.envExample) : []),
    ...(snapshot.dockerCompose ? parseEnvKeys(snapshot.dockerCompose) : []),
  ]);

  const fileTree = new Set<string>(snapshot.fileTree ?? []);

  const hits = new Map<string, Set<DetectionSource>>();

  for (const tool of tools) {
    if (!tool.aliases) continue;

    const sources = new Set<DetectionSource>();

    // npm
    for (const pkg of tool.aliases.npm) {
      if (npmPackages.has(pkg)) {
        sources.add("npm");
        break;
      }
    }

    // pip — normalise dashes/underscores on both sides before comparing
    for (const pkg of tool.aliases.pip) {
      const norm = pkg.toLowerCase().replace(/_/g, "-");
      if (pipPackages.has(norm)) {
        sources.add("pip");
        break;
      }
    }

    // env vars
    for (const key of tool.aliases.env_vars) {
      if (envKeys.has(key)) {
        sources.add("env_var");
        break;
      }
    }

    // config files — prefix match so ".cursor/" matches ".cursor/settings.json"
    for (const pattern of tool.aliases.config_files) {
      const prefix = pattern.replace(/^\//, "").replace(/\*$/, "");
      for (const file of fileTree) {
        if (file === prefix || file.startsWith(prefix)) {
          sources.add("config_file");
          break;
        }
      }
      if (sources.has("config_file")) break;
    }

    if (sources.size > 0) {
      hits.set(tool.id, sources);
    }
  }

  return Array.from(hits.entries()).map(([toolId, sources]) => {
    const sourceArr = Array.from(sources) as DetectionSource[];
    return {
      toolId,
      sources: sourceArr,
      confidence: deriveConfidence(sourceArr),
    };
  });
}

function deriveConfidence(sources: DetectionSource[]): DetectionConfidence {
  if (sources.includes("npm") || sources.includes("pip")) return "high";
  if (sources.includes("env_var")) return "medium";
  return "low";
}

/**
 * Returns all tools that have no detection signals (all alias arrays empty or no aliases field).
 * These are shown in the "Did we miss anything?" manual checklist in the UI.
 */
export function getManualOnlyTools(tools: Tool[]): Tool[] {
  return tools.filter((t) => {
    if (!t.aliases) return true;
    return (
      t.aliases.npm.length === 0 &&
      t.aliases.pip.length === 0 &&
      t.aliases.env_vars.length === 0 &&
      t.aliases.config_files.length === 0
    );
  });
}
