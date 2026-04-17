.PHONY: setup dev stop

setup:
	cd frontend && pnpm install
	cd backend && uv sync

dev:
	@echo "Starting backend and frontend..."
	cd backend && uv run uvicorn app.main:app --reload --port 8000 &
	cd frontend && pnpm dev

stop:
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "Stopped all dev servers."
