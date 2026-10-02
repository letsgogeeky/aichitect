variable "cloudflare_api_token" {
  description = "Cloudflare API token for Terraform. Needs Zone:DNS:Edit and Account:Workers Routes:Edit permissions, scoped to the aichitect.dev zone/account. Same shared token reused from Thoth/Sopdet's terraform.tfvars — confirmed via the Cloudflare API to have access to this zone too (same account, 505a25ea9d104dd971b0d10284a7045e)."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns aichitect.dev and the Worker."
  type        = string
  default     = "505a25ea9d104dd971b0d10284a7045e"
}

variable "zone_id" {
  description = "Zone ID for aichitect.dev."
  type        = string
  default     = "de83bc0b056f0bcb7329a4699c3605a8"
}

variable "zone_name" {
  description = "Zone name for Aichitect's domain."
  type        = string
  default     = "aichitect.dev"
}

variable "worker_hostname" {
  description = "Staging hostname the Worker's custom domain routes from — kept separate from the apex (same staged-cutover pattern as Thoth and Sopdet) so there's always a non-production route to validate a deploy against before the apex ever points here. Extra caution here specifically because aichitect.dev has real production users today, unlike Sopdet's pre-launch cutover."
  type        = string
  default     = "aichitect-staging.aichitect.dev"
}

variable "worker_script_name" {
  description = "Must match wrangler.jsonc's \"name\" field — the Worker script this custom domain routes to. Terraform does not deploy the script itself; `wrangler deploy` (run separately, from the repo root) does that. See terraform/README.md for why."
  type        = string
  default     = "aichitect-web"
}
