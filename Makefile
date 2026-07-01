# Makefile for the EvalForge backend.
# Wraps docker-compose.yml (same folder), targeting the "backend" service.
# Run from the project root, e.g.  make up

COMPOSE = docker compose
SERVICE = backend

.PHONY: help build up down logs shell clean

help:    ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-8s %s\n", $$1, $$2}'

build:   ## Build the backend image
	$(COMPOSE) build $(SERVICE)

up:      ## Start the backend (Ctrl+C to stop)
	$(COMPOSE) up $(SERVICE)

down:    ## Stop and remove the containers
	$(COMPOSE) down

logs:    ## Follow the backend logs
	$(COMPOSE) logs -f $(SERVICE)

shell:   ## Open a shell inside the backend container
	$(COMPOSE) exec $(SERVICE) sh

clean:   ## Delete the local SQLite database
	rm -f backend/evalforge.db
