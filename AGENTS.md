# Mealie Development Guide for AI Agents

## Project Overview

Mealie is a self-hosted recipe manager, meal planner, and shopping list application. This repository is a fork of [mealie-recipes/mealie](https://github.com/mealie-recipes/mealie) that stays in sync with upstream, and is the working home for a **new Angular frontend that will replace the existing Nuxt frontend**.

| Component        | Path        | Stack                                                | Status on this fork                                                                       |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Backend          | `mealie/`   | Python 3.12, FastAPI, SQLAlchemy (SQLite/PostgreSQL) | Active; API changes affect both frontends                                                 |
| Nuxt frontend    | `frontend/` | Nuxt 4 (Vue 3 + TypeScript), Vuetify                 | **Read-only reference** — the currently shipping UI; don't modify unless explicitly asked |
| Angular frontend | `angular/`  | Angular 22, Angular Material                         | **Actively under development** — the replacement frontend                                 |

## Skills

Component-specific guidance lives in project skills under `.agents/skills/`. Load the skill(s) matching what you're working on:

| Skill                     | When to use                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `mealie-backend`          | Python/FastAPI backend work: architecture, patterns, commands, testing                       |
| `mealie-frontend-vue`     | Nuxt app — structure, API clients, composables (behavioral reference for feature parity)     |
| `mealie-frontend-angular` | Angular app — Mealie-specific context                                                        |
| `angular-developer`       | General Angular 22 framework & architecture guidance (complements `mealie-frontend-angular`) |
| `angular-unit-tests`      | Writing/modifying Angular `.spec.ts` tests (complements `mealie-frontend-angular`)           |

## Development Commands

All workflow commands run via `task` from the repo root (see `Taskfile.yml`):

```bash
task setup              # install all dependencies (Python + Nuxt + Angular)
task dev:services       # start Postgres & Mailpit containers
task py                 # start the backend on port 9000
task ui                 # start the Nuxt dev server on port 3000
task angular            # start the Angular dev server on port 3001
task docs               # start the MkDocs documentation server
```

Both frontends proxy `/api` (and `/openapi.json`) to the backend on port 9000.

**Code generation — required after Pydantic schema changes:**

```bash
task dev:generate       # Nuxt TS types, Pydantic schema exports, locales, test helpers
task angular:generate   # Angular API client (requires the backend to be running)
```

**Validation:** `task py:check`, `task ui:check`, `task angular:check` (format/lint/type-check/test per component). Run the check(s) for every component you touched before submitting a PR.

## Critical Rules

- **Never hand-edit generated files:** `frontend/app/lib/api/types/`, `angular/src/api/`, and the auto-generated Pydantic `mealie/schema/*/__init__.py` exports — regenerate them instead (commands above).
- **Translations:** only ever modify `en-US` locale files; all other locales are managed via Crowdin and must never be touched.
- **Python via `uv`:** run Python with `uv run ...`, never bare `python`/`pip`.
- **The Nuxt frontend is read-only on this fork:** when porting features to Angular, use it as the behavioral reference alongside `angular/feature-parity-list.md` (which tracks parity status).

## Key Files

- `Taskfile.yml` — all development commands
- `angular/README.md` — Angular app structure & conventions (read before Angular work)
- `angular/feature-parity-list.md` — Angular parity checklist
- `tests/conftest.py` — backend test fixtures
- `dev/code-generation/main.py` — backend code generation entry point

## Resources

- [Documentation](https://docs.mealie.io/) · [Contributors Guide](https://nightly.mealie.io/contributors/developers-guide/code-contributions/) · [Discord](https://discord.gg/QuStdQGSGK)
