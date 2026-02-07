#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until nc -z db 3306; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"
echo "Running Alembic migrations..."
cd /app && alembic upgrade head

echo "Seeding admin account (if needed)..."
python -m app.admin.seed || echo "Seed warning (non-critical)"

echo "Migrations complete, starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
