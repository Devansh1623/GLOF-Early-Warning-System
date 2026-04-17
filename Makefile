.PHONY: dev test lint build seed docker-up docker-down

# ── Development ──────────────────────────────────────────
dev:
	@echo "Starting backend..."
	cd backend && python app.py

sim:
	@echo "Starting simulator..."
	cd simulator && python mock_telemetry.py

ui:
	@echo "Starting frontend..."
	cd frontend && npm start

# ── Testing ──────────────────────────────────────────────
test:
	cd backend && pytest --cov=core --cov=routes --cov-report=term-missing

lint:
	cd backend && flake8 . --max-line-length=120 --exclude=__pycache__,.venv

# ── ML ───────────────────────────────────────────────────
train:
	@echo "Training ML models..."
	cd ml && python train_model.py

# ── Database ─────────────────────────────────────────────
seed:
	cd backend && python -c "from pymongo import MongoClient; from models.seed import seed_database; seed_database(MongoClient().glof_db)"

# ── Docker ───────────────────────────────────────────────
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f backend

# ── Setup ────────────────────────────────────────────────
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
