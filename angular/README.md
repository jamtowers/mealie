# Mealie Angular Frontend

Replacement frontend for Mealie, built with Angular 22 and Angular Material.

## Project Structure

All application code lives under `src/`. The project is organized by **feature areas** following the [Angular Style Guide](https://angular.dev/best-practices/style-guide):

```
src/
├── app/                    # Feature areas (organized by domain)
│   ├── auth/               # Authentication (login, guards, interceptors)
│   ├── layout/             # Shell layout component
│   └── locale/             # Internationalization
├── api/                    # Auto-generated API client — DO NOT EDIT
├── testing/                # Shared test mocks and utilities
├── theme/                  # Angular Material theme overrides
├── main.ts                 # Application bootstrap
├── styles.scss             # Global styles
└── index.html              # Application shell
```

### `src/app/` — Feature Areas

Each feature owns its own subdirectory under `src/app/`. A feature directory contains all the code related to that domain: components, services, guards, models, and routes.

```
src/app/
├── auth/
│   ├── auth.guard.ts
│   ├── auth.service.ts
│   ├── auth.interceptor.ts
│   └── login/
│       ├── login.component.ts
│       ├── login.component.html
│       └── login.component.scss
├── layout/
│   └── default-layout.component.ts
└── locale/
    ├── locale.service.ts
    └── language-dialog.component.ts
```

**Path Aliases:** Use path aliases to import from top-level directories without relative paths:

| Alias        | Resolves To     |
| ------------ | --------------- |
| `@app/*`     | `src/app/*`     |
| `@api/*`     | `src/api/*`     |
| `@testing/*` | `src/testing/*` |
| `@theme/*`   | `src/theme/*`   |
| `@utils/*`   | `src/utils/*`   |

```ts
import { RecipeCRUDService } from "@api/services";
import { authGuard } from "@app/auth/auth.guard";
```

**Rules:**

- **One concept per file** — one component, directive, or service per file.
- **Co-locate related files** — a component's `.ts`, `.html`, and `.scss` files share the same name and live in the same directory.
- **Tests co-located** — `.spec.ts` files live beside the code they test.
- **No type-based directories** — don't create `components/`, `services/`, or `directives/` folders inside a feature.

### `src/api/` — Generated API Client

Auto-generated from the backend's OpenAPI spec using [`ng-openapi`](https://github.com/ruskujang/ng-openapi). Contains:

- `models/` — TypeScript interfaces for API request/response types
- `services/` — Typed HTTP service classes for each API endpoint
- `tokens/` — Injection tokens for configuration
- `providers.ts` — Provider factory for setting up the client

**Never edit these files manually.** Regenerate after backend changes:

```bash
pnpm run generate:api
```

### `src/testing/` — Test Utilities

Shared mocks and test helpers used across the application (e.g., `DomSanitizer`, `localStorage`, icon mocks). Import these in test files instead of duplicating mock implementations.

### `src/theme/` — Material Theme

Angular Material theme configuration and component overrides. Lives outside `src/app/` because it's app-wide styling configuration, not a feature area. Contains SCSS override files for buttons, form fields, menus, sidebar, and snack-bar styling, plus a `theme.service` for runtime theme switching.

### `public/` — Static Assets

Static files served at the root: `favicon.ico`, `manifest.webmanifest`, icons, and locale translation files (`lang/`).

### `src/utils/` — Utility Files

Utilities directory for truly application-wide utilities that don't belong to any single feature: shared pipes, base classes, global services, etc. Use sparingly.

## Adding a New Feature

1. Create a feature directory under `src/app/`:

   ```
   src/app/recipes/
   ```

2. Add components, services, and guards inside that directory. Co-locate a component's files:

   ```
   src/app/recipes/
   ├── recipe-list/
   │   ├── recipe-list.component.ts
   │   ├── recipe-list.component.html
   │   ├── recipe-list.component.scss
   │   └── recipe-list.component.spec.ts
   ├── recipe-detail/
   └── recipe.service.ts
   ```

3. Register routes in `src/app/app.routes.ts` (or a feature-level route config if the feature is large enough to warrant lazy loading).

4. Use the generated API client for data access:

   ```ts
   import { inject } from "@angular/core";

   import { RecipeCRUDService } from "@api/services";

   export class RecipeService {
     private api = inject(RecipeCRUDService);
   }
   ```

5. Use `inject()` for dependencies, `readonly` on `input()`, `output()`, and `model()`, and `protected` on members used only by the template.

## Commands

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `pnpm start`            | Start development server                |
| `pnpm build`            | Production build (output to `dist/`)    |
| `pnpm test`             | Run unit tests (Vitest)                 |
| `pnpm lint`             | Run ESLint                              |
| `pnpm run generate:api` | Regenerate API client from OpenAPI spec |

### via Taskfile

From the Mealie project root, these commands delegate to the Angular workspace:

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `task angular:setup` | Install dependencies (`pnpm install`)     |
| `task angular`       | Start dev server (`ng serve --port 3001`) |
| `task angular:build` | Production build                          |
| `task angular:lint`  | Run linter                                |
| `task angular:test`  | Run tests                                 |
| `task angular:check` | Run lint + test                           |

## Dependencies

- **Angular 22** — framework, router, forms, service worker
- **Angular Material 22** — UI component library
- **@ngx-translate** — i18n translation support
- **@mdi/angular-material** — Material Design Icons
- **fuse.js** — fuzzy search
- **ng-openapi** — API client generation (dev)
- **Vitest** — unit testing
