# FinanceOS backend foundation

## Run locally

Copy `.env.example` to `.env`, then start the complete local stack from the repository root:

```bash
docker compose up --build
```

Swagger is at `http://localhost:8000/docs`. Health endpoints are `/api/v1/health`, `/api/v1/live`, and `/api/v1/ready`.

## Development commands

```bash
poetry install
poetry run uvicorn app.main:app --reload
poetry run pytest
poetry run ruff check .
poetry run black --check .
poetry run mypy app
poetry run alembic upgrade head
poetry run alembic revision --autogenerate -m "description"
```

Migrations are run as a separate controlled deployment step. The initial revision is intentionally empty: feature migrations follow the approved database design.
