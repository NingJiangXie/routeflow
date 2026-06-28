# RouteFlow Makefile
# Common development tasks automation

.PHONY: help install dev dev:all test test:watch test:coverage lint format build build:prod docker docker:dev docker:down clean check诗人

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m

# Default target
help:
	@echo ""
	@echo "$(GREEN)RouteFlow$(NC) - Development Commands"
	@echo ""
	@echo "$(GREEN)Setup & Installation$(NC)"
	@echo "  make install          Install all dependencies"
	@echo "  make install:frontend Install frontend dependencies only"
	@echo "  make install:backend  Install backend dependencies only"
	@echo ""
	@echo "$(GREEN)Development$(NC)"
	@echo "  make dev              Start frontend dev server"
	@echo "  make dev:all          Start both frontend and backend"
	@echo "  make stop             Stop all running servers"
	@echo ""
	@echo "$(GREEN)Testing$(NC)"
	@echo "  make test             Run all tests (frontend + backend)"
	@echo "  make test:watch       Run tests in watch mode"
	@echo "  make test:coverage    Run tests with coverage report"
	@echo "  make test:frontend    Run frontend tests only"
	@echo "  make test:backend     Run backend tests only"
	@echo ""
	@echo "$(GREEN)Code Quality$(NC)"
	@echo "  make lint             Run ESLint on frontend"
	@echo "  make lint:fix         Run ESLint and auto-fix"
	@echo "  make format           Format code with Prettier"
	@echo "  make format:check     Check code formatting"
	@echo ""
	@echo "$(GREEN)Build & Deploy$(NC)"
	@echo "  make build            Build frontend for production"
	@echo "  make build:prod       Build frontend (production mode)"
	@echo "  make docker           Build Docker images"
	@echo "  make docker:dev       Start development with Docker"
	@echo "  make docker:down      Stop Docker containers"
	@echo ""
	@echo "$(GREEN)Utilities$(NC)"
	@echo "  make audit            Run security audit"
	@echo "  make clean            Clean build artifacts"
	@echo ""
	@echo "$(YELLOW)Examples$(NC)"
	@echo "  # First time setup"
	@echo "  make install && make dev"
	@echo ""
	@echo "  # Before pushing changes"
	@echo "  make test && make lint && make format"
	@echo ""

# Installation
install: install:frontend install:backend
	@echo "$(GREEN)All dependencies installed!$(NC)"

install:frontend:
	@echo "Installing frontend dependencies..."
	cd web && npm install

install:backend:
	@echo "Installing backend dependencies..."
	pip install -r requirements.txt

# Development servers
dev:
	@echo "Starting frontend dev server..."
	cd web && npm run dev

dev:all:
	@echo "Starting all servers..."
	@echo "$(YELLOW)Note: Run 'python -m uvicorn api.app:app' in another terminal for the API server.$(NC)"
	cd web && npm run dev

stop:
	@echo "Stopping servers..."
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop-routeflow.ps1 2>/dev/null || true
	@taskkill /F /IM python.exe 2>nul || true
	@echo "$(GREEN)Servers stopped.$(NC)"

# Testing
test: test:frontend test:backend

test:watch:
	@echo "Running tests in watch mode..."
	cd web && npm run test:watch

test:coverage:
	@echo "Running tests with coverage..."
	cd web && npm run test:coverage
	cd api && python -m pytest --cov=. --cov-report=html

test:frontend:
	@echo "Running frontend tests..."
	cd web && npm run test

test:backend:
	@echo "Running backend tests..."
	cd api && python -m pytest -v

# Code quality
lint:
	@echo "Running ESLint..."
	cd web && npm run lint

lint:fix:
	@echo "Running ESLint with auto-fix..."
	cd web && npm run lint:fix

format:
	@echo "Formatting code with Prettier..."
	cd web && npm run format

format:check:
	@echo "Checking code formatting..."
	cd web && npm run format:check

# Build
build:
	@echo "Building frontend..."
	cd web && npm run build

build:prod:
	@echo "Building frontend for production..."
	cd web && npm run build:prod

# Docker
docker:
	@echo "Building Docker images..."
	docker-compose build

docker:dev:
	@echo "Starting development environment with Docker..."
	docker-compose -f docker-compose.dev.yml up --build

docker:down:
	@echo "Stopping Docker containers..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Security audit
audit:
	@echo "Running security audit..."
	cd web && npm audit --audit-level=moderate
	@echo ""
	@echo "Checking Python dependencies..."
	@pip-audit --desc --format=markdown 2>/dev/null || echo "Install pip-audit: pip install pip-audit"

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf web/dist
	rm -rf api/__pycache__
	rm -rf api/.pytest_cache
	rm -rf web/.vitest
	rm -rf web/node_modules/.vite
	rm -rf .coverage
	rm -rf coverage
	rm -rf htmlcov
	rm -rf *.egg-info
	rm -rf build dist
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Clean complete!$(NC)"
