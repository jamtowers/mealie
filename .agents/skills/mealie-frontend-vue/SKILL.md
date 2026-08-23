---
name: mealie-frontend-vue
description: Working with the Mealie Nuxt 4 (Vue 3) frontend in frontend/. Use when reading or modifying Nuxt app code (pages, components, composables, API clients) or when porting features to Angular using the Nuxt app as the behavioral reference.
---

# Mealie Nuxt (Vue) Frontend

> **Status on this fork: read-only reference.** The Nuxt app in `frontend/` is the currently shipping Mealie UI, but active frontend development has moved to `angular/` (see the `mealie-frontend-angular` skill). Don't modify code in `frontend/` unless explicitly asked — its primary role here is the behavioral reference for the Angular port (tracked in `angular/feature-parity-list.md`).

## Stack & Layout

- Nuxt 4 (Vue 3 + TypeScript, SSR off), Vuetify, `@nuxtjs/i18n`, PWA.
- App code in `frontend/app/`: `pages/`, `components/`, `composables/`, `lib/`, `layouts/`, `middleware/`, `plugins/`, `lang/`, `tests/`, `types/`.
- Dev server on port 3000 (`task ui`); the Nitro server proxies `/api`, `/docs`, and `/openapi.json` to the backend (port 9000) via `frontend/server/`.

## Component Naming (strict conventions)

| Kind | Location | Naming |
| --- | --- | --- |
| Domain (feature-specific) | `components/<Domain>/` | prefixed with the domain, e.g. `AdminDashboard` |
| Global (reusable primitive) | `components/global/` | prefixed with `Base`, e.g. `BaseButton` |
| Layout (has props) | `components/Layout/` | prefixed with `App` |
| Layout (singleton) | `components/Layout/` | prefixed with `The` |
| Page decomposition | `components/` | last resort for breaking up a complex page |

## API Client Pattern

- Clients in `frontend/app/lib/api/` (`client-user.ts`, `client-admin.ts`, `client-public.ts`) extend `BaseAPI`, `BaseCRUDAPI`, or `BaseCRUDAPIReadOnly` (see `lib/api/base/base-clients.ts`).
- Types come from the auto-generated `frontend/app/lib/api/types/` — **never edit by hand**; regenerate with `task dev:generate`.

```ts
const api = useUserApi();
const recipe = await api.recipes.getOne(recipeId);
```

## Composables & State

- Shared state and API logic live in `frontend/app/composables/` — prefer composables over duplicating logic inline (no Vuex/Pinia stores).
- `use-auth-backend.ts` → authentication state · `use-mealie-auth.ts` → user management · `composables/api/api-client.ts` → API client factory.

## i18n

- Locales in `frontend/app/lang/`; Mealie translation files use single-brace `{param}` interpolation.
- **Only `en-US` may be modified** — all other locales are managed via Crowdin and must never be touched (PRs modifying them are rejected).

## Commands

| Command | Purpose |
| --- | --- |
| `task setup:ui` | `pnpm install` in `frontend/` |
| `task ui` | Run the dev server (port 3000) |
| `task ui:build` / `task ui:generate` | Build / statically generate into `frontend/dist` |
| `task ui:lint` / `task ui:test` / `task ui:check` | ESLint / Vitest / both |

## Validation

- Run `task ui:check` for any changes to `frontend/`.
- When backend Pydantic schemas change, run `task dev:generate` to regenerate `frontend/app/lib/api/types/` and the locale TS.
