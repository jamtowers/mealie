---
name: mealie-backend
description: Working with the Mealie Python backend (FastAPI + SQLAlchemy) in mealie/. Use for backend features, routes, services, repositories, Pydantic schemas, database migrations, or running/validating backend code (task py:*).
---

# Mealie Python Backend

The backend lives in `mealie/` (Python 3.12, FastAPI, SQLAlchemy with SQLite or PostgreSQL support). In production the frontend is statically generated into `mealie/frontend` and served by FastAPI's SPA module (`mealie/routes/spa/`).

## Architecture: Repository → Service → Controller

- **Controllers** (`mealie/routes/**/controller_*.py`): inherit `BaseUserController` / `BaseAdminController` (see `mealie/routes/_base/base_controllers.py`). Handle HTTP concerns and delegate to services. Use the `HttpRepo` mixin (`mealie/routes/_base/mixins.py`) for common CRUD operations.
- **Services** (`mealie/services/`): inherit `BaseService`. Business logic layer that coordinates repositories and external dependencies — they should not access the database directly.
- **Repositories** (`mealie/repos/`): SQLAlchemy data access, accessed via the `AllRepositories` factory (`mealie/repos/all_repositories.py`, see also `repository_factory.py`). Repos are scoped to the group/household context automatically — passing the wrong IDs causes 404s.

Routes are organized by domain under `mealie/routes/` (auth, recipe, groups, households, admin) using `APIRouter` with FastAPI dependency injection and Pydantic response models.

```python
from fastapi import Depends
from mealie.repos.all_repositories import AllRepositories, get_repositories

def my_route(
    repos: AllRepositories = Depends(get_repositories),
    user: PrivateUser = Depends(get_current_user),
):
    recipe = repos.recipes.get_one(recipe_id)
```

## Schemas & Type Generation

- Pydantic schemas in `mealie/schema/` with strict `*In` / `*Out` / `*Create` / `*Update` suffixes.
- Submodule `__init__.py` exports are auto-generated — never edit them by hand.
- **After any schema change run `task dev:generate`** to regenerate:
  - `frontend/app/lib/api/types/` (Nuxt TypeScript types)
  - Pydantic `mealie/schema/*/__init__.py` exports
  - Locales, pytest test data paths, and pytest route helpers
- The Angular API client (`angular/src/api/`) is generated separately via `task angular:generate` (backend must be running).

## Database & Sessions

- SQLAlchemy models in `mealie/db/models/`; Alembic migrations in `mealie/alembic/`.
- New migration: `task py:migrate -- "description"` (auto-generates the revision, then formats).
- In routes: obtain sessions via `Depends(generate_session)`. In services/scripts: use the `session_context()` context manager (`mealie/db/db_setup.py`). Don't open sessions manually.

## Settings & Configuration

- `settings = get_app_settings()` (cached singleton) · `dirs = get_app_dirs()`.
- Never instantiate `AppSettings()` directly.

## Conventions

- Type hints are mandatory (mypy-clean); handle `Optional` types explicitly.
- Multi-tenancy: all data is scoped to **groups** and **households** — groups contain households, and recipes, meal plans, and shopping lists live under households. Repositories filter by group/household context automatically; validate ownership before operations.
- Always run Python through `uv` (`uv run python mealie/app.py`, `uv run pytest tests/`) — never bare `python`/`pip`.
- Pre-commit hooks (Ruff format/lint) are installed by `task setup:py`.

## Commands

| Command | Purpose |
| --- | --- |
| `task setup:py` | Install Python deps + pre-commit hooks |
| `task dev:services` | Start Postgres & Mailpit containers |
| `task py` | Run the backend (port 9000, SQLite by default) |
| `task py:postgres` | Run the backend against containerized Postgres |
| `task py:test -- -k test_name` | Run pytest (supports args after `--`) |
| `task py:check` | Format + lint + type-check + test |
| `task py:migrate -- "description"` | Generate an Alembic migration |
| `task dev:generate` | Regenerate schema exports, TS types, locales, test helpers |
| `task docker:prod` | Build & run the production Docker Compose stack |

## Testing

- Fixtures live in `tests/fixtures/` (see `tests/conftest.py`); use the `api_client` fixture for integration tests.
- Follow the existing patterns in `tests/integration_tests/` and `tests/unit_tests/`.
