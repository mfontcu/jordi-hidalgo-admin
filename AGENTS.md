# Guía para agentes de IA

Panel de administración de **Hidalgo Junior** en React + TypeScript. Sustituirá al panel Flutter (`jordi_hidalgo_app/apps/admin_app`) en un único cutover cuando la checklist de paridad esté completa.

- **Decisión de arquitectura:** ADR-003 en el hub (`../knowledge-base-hub`, `/engineering/adrs/admin-panel-react-spa`). Manda sobre este archivo en stack, capas, reglas de dependencia, flujo de datos y quality gates.
- **Plan y estado:** iniciativa `/initiatives/admin-panel-react-migration` del hub (fases, criterios de hecho, checklist de paridad).
- **Contrato del backend:** `/engineering/apis/hidalgo-backend-rest` (`jordi_hidalgo_backend/docs/contracts/apis/backend-rest-api.md`).
- **No hay staging:** se desarrolla y se compara con el panel Flutter en localhost contra el backend local; el cutover despliega directamente en producción.
- **No hagas commit ni push** salvo petición explícita.

## Repos del ecosistema

- `jordi_hidalgo_backend` — API REST; publica el contrato OpenAPI 3 (`docs/openapi.json`)
- **Este repo** — Panel admin React
- `jordi_hidalgo_app` — Flutter (`customer_app`, `admin_app` hasta el cutover)
- `jordi_hidalgo_web` — Web pública

## Capas (ADR-003 §2 y §4)

```
app → routes → features/*/ui → features/*/hooks → features/*/api → shared/api
                                                 ↘ features/*/model ← (ui, hooks, api)
```

| Carpeta                   | Contiene                                                          | No puede                                            |
| ------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `src/app`                 | main, providers, router, shell                                    | — (raíz de composición)                             |
| `src/routes`              | rutas de TanStack Router (archivos)                               | más markup que renderizar la pantalla de la feature |
| `src/features/*/model`    | view models, esquemas Zod, mapeos de presentación, reglas cliente | importar React, librerías de datos u otra feature   |
| `src/features/*/api`      | query keys, `queryOptions`, mutaciones, mappers DTO → view model  | renderizar                                          |
| `src/features/*/hooks`    | lógica de pantalla                                                | JSX; usar `shared/api` directamente                 |
| `src/features/*/ui`       | pantallas y componentes                                           | `fetch`, reglas de negocio inline                   |
| `src/features/*/index.ts` | superficie pública de la feature                                  | —                                                   |
| `src/shared/*`            | `api`, `ui`, `lib`, `i18n`, `config`                              | importar `features`, `routes` o `app`               |

`eslint-plugin-boundaries` lo aplica: una violación rompe `npm run lint`. Otra feature solo se importa por su `index.ts`.

## Convenciones críticas

| Tema            | Regla                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contrato        | `contract/openapi.json` es copia literal del backend en el commit de `contract/SOURCE.json`. Actualizar: `npm run api:sync -- <ref>` (lee `../jordi_hidalgo_backend` o `BACKEND_REPO`). No editar ni `contract/` ni `schema.gen.ts` a mano |
| Tipos DTO       | Solo llegan hasta `features/*/api`; la UI ve view models                                                                                                                                                                                   |
| Cliente HTTP    | Solo `shared/api` importa `openapi-fetch`                                                                                                                                                                                                  |
| Copy            | Solo de `src/shared/i18n/messages/{es,ca,en}.json`; `react/jsx-no-literals` bloquea texto literal. Claves tipadas: una clave inexistente no compila                                                                                        |
| Mensajes        | Añadir la clave en los tres idiomas con los mismos argumentos ICU; `npm run i18n:check`                                                                                                                                                    |
| Fechas          | Solo `shared/lib/business-time.ts` convierte y formatea (`Europe/Madrid`); lint prohíbe `new Date(x)` y `toLocale*` fuera                                                                                                                  |
| Estado servidor | Solo TanStack Query; Zustand solo para sesión y preferencias                                                                                                                                                                               |
| Estado en URL   | Filtros, búsqueda, página, orden, fecha y pestaña: search params con esquema Zod                                                                                                                                                           |
| Entorno         | `VITE_API_BASE_URL` en build; Zod lo valida y la app no arranca si es inválido                                                                                                                                                             |
| Almacenamiento  | Claves `hj_admin.*` en `localStorage`                                                                                                                                                                                                      |

## Comandos

```bash
npm install
npm run dev            # http://localhost:5173 contra VITE_API_BASE_URL de .env.development
npm run check          # todo lo que corre el CI
npm run typecheck      # tsc
npm run lint           # ESLint (incluye reglas de capas)
npm run format         # Prettier
npm test               # Vitest + Testing Library + MSW
npm run e2e            # Playwright contra el build de producción (build:e2e antes)
npm run api:sync -- <ref>   # Copia el contrato del backend en <ref> y regenera el schema
npm run api:check      # Drift check del schema generado
npm run i18n:check     # Paridad de claves y sintaxis ICU
npm run budget         # Presupuesto del bundle (tras build)
```

Imagen de producción (nginx, CSP incluida):

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t jordi-hidalgo-admin:local .
docker run --rm -p 8089:80 jordi-hidalgo-admin:local
PLAYWRIGHT_BASE_URL=http://localhost:8089 npm run e2e
```

## Tests

- `model` y `shared/lib`: unit tests de funciones puras, sin mocks.
- `api` + `hooks` + `ui`: tests con MSW en el borde de red (`src/test/msw`) y `renderWithProviders` (`src/test/render.tsx`).
- Playwright (`e2e/`) para los recorridos críticos.

## Archivos clave

| Archivo                           | Para qué                    |
| --------------------------------- | --------------------------- |
| `src/app/app.tsx`, `router.ts`    | Providers y router          |
| `src/shared/api/client.ts`        | Cliente tipado y middleware |
| `src/shared/i18n/`                | Mensajes, idioma, provider  |
| `src/shared/config/env.ts`        | Variables de entorno        |
| `eslint.config.js`                | Reglas de capas y de copy   |
| `deploy/*.template`, `Dockerfile` | Imagen nginx de producción  |
