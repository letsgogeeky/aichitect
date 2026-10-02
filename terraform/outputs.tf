output "worker_custom_domain" {
  description = "The hostname now routed to the Worker."
  value       = cloudflare_workers_custom_domain.aichitect_staging.hostname
}
