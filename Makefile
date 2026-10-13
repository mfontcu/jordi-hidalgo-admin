# Panel admin (Vite). `make` o `make help` lista los comandos.
#
# Variables (se pueden pasar en la misma línea, p. ej. `make pages API_URL=http://localhost:8080`):
#   API_URL  Origen de la API que queda grabado en el build. Por defecto, producción.
#   IMAGE    Etiqueta de la imagen nginx.
#   PORT     Puerto local al servir esa imagen.
#   REF      Ref de git del backend para `make api-sync` (obligatoria en ese comando).
#   ARB_DIR  Carpeta de ARB para `make i18n-import` (opcional; el script tiene su propio defecto).
.DEFAULT_GOAL := help

API_URL ?= https://api.hidalgojunior.com
IMAGE ?= jordi-hidalgo-admin:local
PORT ?= 8089

.PHONY: help \
	install dev preview \
	check typecheck lint format format-check test test-watch e2e playwright-install \
	build build-e2e budget pages \
	docker-build docker-run docker-e2e \
	api-sync api-check api-generate i18n-check i18n-import icons icons-check docs-lint \
	clean

help: ## Lista los comandos
	@awk 'BEGIN {FS = ":.*##"; printf "Uso: make <comando>\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  %-20s %s\n", $$1, $$2 } \
		/^##@/ { printf "\n%s\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Día a día

install: ## Instala dependencias con el lockfile (Node de .nvmrc)
	npm ci

dev: ## Arranca el panel en http://localhost:5173 (.env.development)
	npm run dev

preview: ## Sirve el último dist/ en http://localhost:4173
	npm run preview

##@ Comprobaciones

check: ## Todo lo que corre el CI: tipos, lint, formato, contrato, i18n, iconos, tests, build y e2e
	npm run check

typecheck: ## Comprueba los tipos (tsc)
	npm run typecheck

lint: ## ESLint, incluidas las reglas de capas
	npm run lint

format: ## Formatea con Prettier
	npm run format

format-check: ## Comprueba el formato sin escribir
	npm run format:check

test: ## Tests de Vitest
	npm run test

test-watch: ## Vitest en modo watch
	npm run test:watch

e2e: build-e2e ## Playwright contra el build e2e (Chromium)
	npm run e2e

playwright-install: ## Instala el Chromium que usan los e2e
	npx playwright install chromium

##@ Bundle

build: ## Genera dist/. La API queda grabada (API_URL, producción por defecto)
	VITE_API_BASE_URL="$(API_URL)" npm run build

build-e2e: ## Build que usan Playwright y el presupuesto del bundle (.env.e2e)
	npm run build:e2e

budget: ## Comprueba el tamaño de dist/ (después de build o build-e2e)
	npm run budget

pages: build ## dist/ para subir a Cloudflare Pages
	@echo "Sube el contenido de dist/ (API: $(API_URL))."

##@ Imagen nginx

docker-build: ## Construye la imagen. La CSP de connect-src usa API_URL
	docker build --build-arg VITE_API_BASE_URL="$(API_URL)" -t "$(IMAGE)" .

docker-run: ## Sirve la imagen en localhost, puerto PORT (8089 por defecto; requiere docker-build)
	docker run --rm -p "$(PORT):80" "$(IMAGE)"

docker-e2e: ## Playwright contra la imagen ya en marcha en PORT
	PLAYWRIGHT_BASE_URL="http://localhost:$(PORT)" npm run e2e

##@ Contrato y ficheros generados

api-sync: ## Copia el OpenAPI del backend y regenera el schema. Uso: make api-sync REF=<git-ref>
	@test -n "$(REF)" || { echo "Falta REF. Ejemplo: make api-sync REF=main" >&2; exit 1; }
	npm run api:sync -- "$(REF)"

api-check: ## Comprueba que el schema generado coincide con el contrato
	npm run api:check

api-generate: ## Regenera el schema TypeScript desde contract/openapi.json
	npm run api:generate

i18n-check: ## Paridad de claves y sintaxis ICU en es, ca y en
	npm run i18n:check

i18n-import: ## Importa los ARB del panel Flutter. Opcional: make i18n-import ARB_DIR=<ruta>
	npm run i18n:import-arb -- $(ARB_DIR)

icons: ## Regenera los iconos desde icons.json
	npm run icons:generate

icons-check: ## Comprueba que los iconos generados no han derivado
	npm run icons:check

docs-lint: ## Valida docs/ con el motor del hub de conocimiento
	npm run docs:lint

##@ Limpieza

clean: ## Borra dist/
	rm -rf dist
