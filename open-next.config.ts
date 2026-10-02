import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal starting config — default in-memory/KV incremental cache.
// Revisit once ISR usage on this app is characterized (see migration plan
// §Compute "ISR / incremental cache backing" — KV is the default
// recommendation, R2 only if revalidation volume grows).
export default defineCloudflareConfig();
