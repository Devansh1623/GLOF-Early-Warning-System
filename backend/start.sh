#!/bin/bash
set -e

echo "==> Starting Celery worker in background..."
python -m celery -A celery_app.celery_app worker \
  -Q notifications \
  --loglevel=info \
  --concurrency=1 &

echo "==> Starting Gunicorn..."
exec gunicorn app:app \
  --bind "0.0.0.0:${PORT:-5000}" \
  --workers 1 \
  --threads 4 \
  --timeout 120
