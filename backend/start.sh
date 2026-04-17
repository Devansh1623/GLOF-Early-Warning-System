#!/bin/bash
# No set -e — we want Gunicorn to start even if Celery/Simulator fail

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

# Start telemetry simulator in background
# Posts to localhost so no external networking needed
echo "==> Starting telemetry simulator in background..."
BACKEND_URL="http://localhost:${PORT:-10000}" \
INTERVAL_SECONDS=8 \
  python ../simulator/mock_telemetry.py &

SIM_PID=$!
echo "==> Simulator PID: $SIM_PID"

# Start Gunicorn (foreground — this is what Render monitors for the port)
echo "==> Starting Gunicorn..."
exec gunicorn app:app \
  --bind "0.0.0.0:${PORT:-5000}" \
  --workers 1 \
  --threads 4 \
  --timeout 120
