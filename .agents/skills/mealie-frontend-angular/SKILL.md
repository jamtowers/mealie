---
name: mealie-frontend-angular
description: Working with the new Mealie Angular 22 frontend in angular/ (the Nuxt replacement under active development on this fork). Use for Angular app features, routing, the generated API client, i18n, theming, or when porting features from the Nuxt frontend.
---

# Mealie Angular Frontend

The Angular app in `angular/` (Angular 22 + Angular Material) replaces the Nuxt frontend and is the active frontend on this fork. It targets the same backend API (OpenAPI).

**Before working in `angular/`:**

1. Read `angular/README.md` — the authoritative guide for app structure and conventions.
2. For framework-level Angular decisions (components, signals, DI, forms, routing, styling) → use the **`angular-developer`** skill.
3. For writing or modifying `.spec.ts` tests → use the **`angular-unit-tests`** skill (shared mocks live in `src/testing/`).

This skill only carries the Mealie-specific context.

## Project-Specific Context

- **Path aliases**: `@app/` → `src/app/`, `@api/` → `src/api/`, `@testing/` → `src/testing/`, `@theme/` → `src/theme/`, `@utils/` → `src/utils/`.
- **Feature areas** under `src/app/` (currently `auth`, `core`, `layout`, `locale`): each feature owns its components, services, guards, and routes. Co-locate a component's `.ts`/`.html`/`.scss`/`.spec.ts`; no type-based subdirectories.
- **App wiring** in `src/app/app.config.ts`: `provideHttpClient` with `authInterceptor` (in `auth/`), `provideDefaultClient` from `@api/providers`, ngx-translate with `MealieParser` (single-brace `{param}` interpolation) loading from `/lang/`, plus `ThemeService` / `LocaleService` initializers and a service worker in production.

## Generated API Client (never edit)

- `src/api/` is generated from the running backend's OpenAPI spec by `ng-openapi` (`angular/openapi.config.ts`): typed models (`models/`), a service class per endpoint (`services/`), configuration tokens and the `provideDefaultClient` factory (`tokens/`, `providers.ts`).
- Regenerate after backend changes — the backend must be running first:

```bash
task py                # one terminal (port 9000)
task angular:generate  # pnpm run generate:api
```

- A custom `RelationalOperatorPlugin` in the generator config rewrites the `RelationalOperator` enum (values like `=` and `<>` aren't valid TS identifiers) — preserve it when touching generator config.

## Development

- Dev server on port 3001 (`task angular`); `proxy.conf.json` proxies `/api`, `/docs`, and `/openapi.json` to `http://localhost:9000`.
- i18n via ngx-translate; locale JSON in `angular/public/lang/` — **only `en-US` may be modified** (other locales come from Crowdin).
- Material theme overrides in `src/theme/`; shared test mocks/utilities in `src/testing/`.

| Command | Purpose |
| --- | --- |
| `task angular:setup` | `pnpm install` in `angular/` |
| `task angular` | Run the dev server (port 3001) |
| `task angular:generate` | Regenerate `src/api/` from the OpenAPI spec (backend must be running) |
| `task angular:build` | Production build to `angular/dist` |
| `task angular:lint` / `task angular:test` / `task angular:check` | ESLint / Vitest / both |

## Porting Features from Nuxt

- Parity status is tracked in `angular/feature-parity-list.md` — check it before starting a feature and update it when one is complete.
- The Nuxt app in `frontend/` is the behavioral reference (see the `mealie-frontend-vue` skill for its structure) — read it to understand existing behavior, but don't modify it.
