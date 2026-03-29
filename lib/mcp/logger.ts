import { createClient } from "@supabase/supabase-js";

interface McpEvent {
  tool: string;
  duration_ms: number;
  success: boolean;
  tool_count?: number;
  skipped_count?: number;
}

/**
 * Fire-and-forget MCP event logger. Never throws — logging must never block or
 * break a tool response.
 */
export function logMcpEvent(event: McpEvent): void {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const serviceKey = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  const client = createClient(url, serviceKey);
  void client.from("mcp_events").insert(event);
}
