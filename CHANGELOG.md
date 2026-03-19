# Changelog

All notable changes to AIchitect will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MIT `LICENSE` file
- `.env.example` documenting that no environment variables are required
- Prettier formatting with `.prettierrc` and `.prettierignore`
- `.editorconfig` for consistent cross-editor settings
- Pre-commit hooks via Husky + lint-staged (format + lint on staged files)
- CI pipeline (`.github/workflows/ci.yml`): lint → typecheck → build on every PR
- `make format` and `make check` targets
- `CONTRIBUTING.md` with full setup guide, data contribution instructions, and PR process
- `CODE_OF_CONDUCT.md`
- `SECURITY.md` with responsible disclosure process
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/` bug report and feature request templates
- Dependabot for automated weekly npm and GitHub Actions dependency updates
- `.vscode/extensions.json` and `.vscode/settings.json` for recommended editor setup

## [0.1.0] - 2025-01-01

### Added
- Initial release
- Explore graph: 2D grid, 2D layers (swimlane), and 3D force graph views
- 123 tools across 12 categories with filtering, search, and detail panel
- 10 curated stacks visualised as integration diagrams
- Builder: slot-by-slot stack composer with shareable URL (`?s=...`)
- OG image generation for Builder shares
- `/badge` endpoint for shields.io-style stack badges
- Docker-first dev setup with hot reload
