.env:
	cp .env.example .env

config.yaml:
	cp config.yaml.example config.yaml

.PHONY: setup
setup: config.yaml .env
	@echo "Setup complete."

.PHONY: dev
dev:
	@echo "Starting development server..."
	npm run dev