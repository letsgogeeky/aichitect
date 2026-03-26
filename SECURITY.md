# Security Policy

## Scope

AIchitect is a Next.js web application with a Supabase backend, GitHub OAuth authentication, and server-side API routes. The attack surface includes the deployed Next.js app, Supabase database and auth, API endpoints (`/api/roast`, `/api/challenge`, `/api/cron/sync-health`), and npm dependencies.

## Reporting a vulnerability

If you discover a security issue — including a vulnerable dependency, an XSS vector in the rendered output, or a supply-chain concern — please **do not open a public GitHub issue**.

Instead, report it privately via one of these channels:

- **GitHub private vulnerability reporting:** use the [Security tab](https://github.com/letsgogeeky/aichitect/security/advisories/new) on the repo
- **Email:** open a GitHub issue asking for a private contact and a maintainer will reply with an email address

Please include:

- A description of the issue
- Steps to reproduce or a proof of concept
- The potential impact

We will acknowledge the report within 5 business days and aim to release a fix or mitigation within 30 days of confirmation.

## Dependency updates

Dependencies are kept up to date via Dependabot. If you notice an unpatched CVE in a dependency before Dependabot catches it, a report via the channels above is appreciated.

## Out of scope

- Theoretical vulnerabilities with no practical impact on a static site
- Issues in forked or self-hosted deployments that deviate from the documented setup
