create table mcp_events (
  id            bigserial    primary key,
  tool          text         not null,
  called_at     timestamptz  not null default now(),
  duration_ms   int,
  success       boolean      not null,
  tool_count    int,
  skipped_count int
);

-- Index for time-series queries and per-tool aggregations
create index mcp_events_called_at_idx on mcp_events (called_at desc);
create index mcp_events_tool_idx      on mcp_events (tool);
