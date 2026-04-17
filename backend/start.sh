#!/bin/bash
# No set -e — we want Gunicorn to start even if Celery fails

# Ensure the backend directory is in PYTHONPATH for local imports (core.*, tasks, etc.)
export PYTHONPATH="$(cd "$(dirname "$0")" && pwd):${PYTHONPATH}"

echo "==> PYTHONPATH: $PYTHONPATH"
echo "==> Working dir: $(pwd)"

# Start Celery worker in background (non-fatal — if it fails, Gunicorn still runs)
echo "==> Starting Celery worker in background..."
python -m celery -A celery_app.celery_app worker \
  -Q notifications \
  --loglevel=info \
  --concurrency=1 &

CELERY_PID=$!
echo "==> Celery PID: $CELERY_PID"

# Start Gunicorn (foreground — this is what Render monitors for the port)
echo "==> Starting Gunicorn..."
exec gunicorn app:app \
  --bind "0.0.0.0:${PORT:-5000}" \
  --workers 1 \
  --threads 4 \
  --timeout 120
