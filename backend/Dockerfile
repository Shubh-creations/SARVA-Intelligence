FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN pip install --no-cache-dir poetry==1.8.5
COPY pyproject.toml ./
RUN poetry config virtualenvs.create false && poetry install --only main --no-root
COPY app ./app
COPY alembic.ini ./
COPY alembic ./alembic
RUN useradd --create-home --uid 10001 financeos && chown -R financeos:financeos /app
USER financeos
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
