terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # Local state for the proof-of-concept phase — deliberately not remote
  # (no S3/R2 backend wired yet), matching Thoth's and Sopdet's same
  # decision. Revisit before more than one person or CI runs
  # `terraform apply` against this: local state has no locking, so
  # concurrent applies can corrupt it.
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
