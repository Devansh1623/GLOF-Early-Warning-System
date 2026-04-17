#!/bin/bash
set -e

# The backend directory must be in PYTHONPATH so that
# 'from core.xxx import ...' resolves relative to backend/
export PYTHONPATH="$(cd "$(dirname "$0")" && pwd):${PYTHONPATH}"

echo "==> PYTHONPATH: $PYTHONPATH"
echo "==> Working dir: $(pwd)"

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
