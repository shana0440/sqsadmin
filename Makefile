TAG ?= $(shell git rev-parse --short=8 HEAD)
REPOSITORY ?= sqsadmin
REGISTRY ?= 122610499596.dkr.ecr.ap-east-1.amazonaws.com

.env:
	cp .env.example .env

.PHONY: setup
setup: .env
	@echo "Setup complete."

.PHONY: dev
dev:
	@echo "Starting development server..."
	npm run dev

.PHONY: build
build:
	docker build --platform linux/amd64 --load -t $(REGISTRY)/$(REPOSITORY):$(TAG) .

.PHONY: push
push:
	docker push $(REGISTRY)/$(REPOSITORY):$(TAG)

.PHONY: ecr-login
ecr-login:
	aws ecr get-login-password --region ap-east-1 | docker login --username AWS --password-stdin $(REGISTRY)

.PHONY: deploy
deploy:
	helm upgrade --install sqsadmin ./helm \
		--namespace infra-sqsadmin --create-namespace \
		-f ./helm/values-$(ENV).yaml \
		--set image.tag=$(TAG)
