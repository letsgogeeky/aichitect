-- status.replicate.com no longer serves an Atlassian Statuspage payload:
-- since Replicate joined Cloudflare it 301s to cloudflarestatus.com's HTML
-- service list (verified 2026-10-10), so every hourly sync-incidents run
-- logged a JSON parse error for it. Disable rather than delete, same as
-- 20260530141115 — flip it back on if Replicate exposes a new endpoint.

UPDATE tool_status_page
SET enabled = false
WHERE tool_id = 'replicate';
