.PHONY: help build run test clean docker-build docker-run docker-compose-up docker-compose-down version-bump-patch version-bump-minor version-bump-major version-tag

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Go application locally
	cd backend && go build -o ../bin/server ./cmd/server

run: ## Run the application locally (requires database)
	cd backend && go run ./cmd/server

test: ## Run tests
	cd backend && go test ./...

clean: ## Clean build artifacts
	rm -rf bin/
	rm -rf backend/bin/

docker-build: ## Build Docker image
	docker build -t rackview:latest .

docker-run: ## Run Docker container (requires database)
	docker run -d \
		-p 8080:8080 \
		-e DB_HOST=postgres \
		-e DB_PORT=5432 \
		-e DB_USER=rackview \
		-e DB_PASSWORD=rackview \
		-e DB_NAME=rackview \
		--name rackview \
		rackview:latest

docker-compose-up: ## Start services with docker-compose
	docker-compose up -d

docker-compose-down: ## Stop services with docker-compose
	docker-compose down

version-get: ## Get current version
	@./scripts/version.sh get 2>/dev/null || .\scripts\version.ps1 get

version-bump-patch: ## Bump patch version (1.2.3 -> 1.2.4)
	@./scripts/version.sh bump patch 2>/dev/null || .\scripts\version.ps1 bump patch

version-bump-minor: ## Bump minor version (1.2.3 -> 1.3.0)
	@./scripts/version.sh bump minor 2>/dev/null || .\scripts\version.ps1 bump minor

version-bump-major: ## Bump major version (1.2.3 -> 2.0.0)
	@./scripts/version.sh bump major 2>/dev/null || .\scripts\version.ps1 bump major

version-tag: ## Create git tag for current version
	@./scripts/version.sh tag 2>/dev/null || .\scripts\version.ps1 tag
