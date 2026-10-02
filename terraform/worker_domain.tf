resource "cloudflare_workers_custom_domain" "aichitect_staging" {
  account_id = var.cloudflare_account_id
  hostname   = var.worker_hostname
  service    = var.worker_script_name
  zone_id    = var.zone_id
  zone_name  = var.zone_name

  # Creating this custom domain requires the Worker script (aichitect-web)
  # to already exist in the account — deploy it once via `wrangler deploy`
  # before the first `terraform apply` here, or this resource will fail
  # to create.
}

# Apex cutover — aichitect.dev now points at the same Worker as staging.
# Vercel's deployment was already down (402 DEPLOYMENT_DISABLED, both
# apex and www) by the time of this cutover, so this fixes an outage
# rather than disrupting working traffic. GitHub OAuth continues to work
# unchanged — Supabase's Redirect URLs allowlist is keyed to the domain
# (aichitect.dev), not the hosting platform, so the existing entry from
# the Vercel era still applies.
resource "cloudflare_workers_custom_domain" "aichitect_apex" {
  account_id = var.cloudflare_account_id
  hostname   = var.zone_name
  service    = var.worker_script_name
  zone_id    = var.zone_id
  zone_name  = var.zone_name
}

# www.aichitect.dev needs its own binding too — Workers Custom Domains
# don't route through a CNAME chain (same finding as Sopdet's cutover):
# a plain proxied CNAME to the apex resolves to the apex's placeholder
# AAAA record and 522s, since only the apex hostname itself has a route.
resource "cloudflare_workers_custom_domain" "aichitect_www" {
  account_id = var.cloudflare_account_id
  hostname   = "www.${var.zone_name}"
  service    = var.worker_script_name
  zone_id    = var.zone_id
  zone_name  = var.zone_name
}
