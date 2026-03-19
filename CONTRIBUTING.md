# Contributing to AIchitect

Thanks for taking the time to contribute! This guide covers everything you need to get from zero to an open PR.

---

## Table of Contents

- [Getting started](#getting-started)
- [Ways to contribute](#ways-to-contribute)
- [Adding a tool](#adding-a-tool)
- [Adding a stack](#adding-a-stack)
- [Code changes](#code-changes)
- [Commit style](#commit-style)
- [Pull request process](#pull-request-process)

---

## Getting started

All development runs through Docker — no local Node.js required.

```bash
git clone https://github.com/letsgogeeky/aichitect.git
cd aichitect
make run        # starts dev server at http://localhost:3000 with hot reload
```

Other useful commands:

```bash
make rebuild    # full rebuild after adding new packages to package.json
make typecheck  # run tsc --noEmit on the host
make lint       # run ESLint on the host
make format     # run Prettier on the host
make check      # lint + typecheck in one shot
make down       # stop and remove containers
make shell      # open a shell inside the running container
```

> Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

---

## Ways to contribute

| Type | Examples |
|---|---|
| **Data** | Add a missing tool, fix incorrect data, add a relationship edge, add a curated stack |
| **Bug fix** | Fix a rendering issue, broken edge, layout problem |
| **Feature** | New view mode, filter, UI improvement |
| **Docs** | Improve README, fix typos, clarify setup steps |

Not sure where to start? Browse [open issues](https://github.com/letsgogeeky/aichitect/issues) or open one describing what you have in mind.

---

## Adding a tool

1. Add an entry to `data/tools.json`:

```json
{
  "id": "my-tool",
  "name": "My Tool",
  "category": "agent-frameworks",
  "tagline": "One sentence description.",
  "description": "Longer description shown in the detail panel.",
  "type": "oss",
  "pricing": { "free_tier": true, "plans": [] },
  "github_stars": 12000,
  "slot": "orchestration",
  "prominent": false,
  "urls": {
    "website": "https://mytool.dev",
    "github": "https://github.com/org/repo"
  }
}
```

Valid categories: `coding-assistants`, `autonomous-agents`, `agent-frameworks`, `llm-providers`, `observability`, `vector-databases`, `deployment`, `mcp`, `design`, `data-auth`, `prompt-eval`, `specifications`.

2. Optionally add edges in `data/relationships.json`:

```json
{ "source": "my-tool", "target": "langchain", "type": "integrates-with" }
```

Valid edge types: `integrates-with`, `often-used-together`, `competes-with`.

3. Update `TOOL_COUNT` in `lib/constants.ts`.

---

## Adding a stack

Add an entry to `data/stacks.json` following the format of an existing stack. Each stack has a name, description, list of tool IDs, and a set of directed flow edges.

---

## Code changes

- **Branch naming:** `feat/short-description`, `fix/short-description`, `chore/short-description`
- **One concern per PR** — keep changes focused; it makes review faster
- Run `make check` before pushing to catch lint and type errors early
- Pre-commit hooks will automatically format and lint staged files via `lint-staged`

---

## Commit style

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add Haystack to agent-frameworks
fix: correct integrates-with edge for LangChain → OpenAI
chore: update TOOL_COUNT constant
docs: improve getting started section
```

---

## Pull request process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `make check` — fix any errors
4. Open a PR using the provided template
5. A maintainer will review and merge or request changes

PRs that add tools or stacks should include a brief rationale for why the tool belongs in the ecosystem map.
