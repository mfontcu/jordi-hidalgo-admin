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

| Tema                 | Regla                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrato             | `contract/openapi.json` es copia literal del backend en el commit de `contract/SOURCE.json`. Actualizar: `npm run api:sync -- <ref>` (lee `../jordi_hidalgo_backend` o `BACKEND_REPO`). No editar ni `contract/` ni `schema.gen.ts` a mano                |
| Tipos DTO            | Solo llegan hasta `features/*/api`; la UI ve view models                                                                                                                                                                                                  |
| Cliente HTTP         | Solo `shared/api` importa `openapi-fetch`                                                                                                                                                                                                                 |
| Copy                 | Solo de `src/shared/i18n/messages/{es,ca,en}.json`; `react/jsx-no-literals` bloquea texto literal. Claves tipadas: una clave inexistente no compila                                                                                                       |
| Mensajes             | Añadir la clave en los tres idiomas con los mismos argumentos ICU; `npm run i18n:check`                                                                                                                                                                   |
| Fechas               | Solo `shared/lib/business-time.ts` convierte y formatea (`Europe/Madrid`); lint prohíbe `new Date(x)`, `Date.parse`, `Date.UTC` y `toLocale*` fuera. Días como `BusinessDay` (`YYYY-MM-DD`); nombres de mes copiados de `intl` de Flutter, no de date-fns |
| Estado servidor      | Solo TanStack Query; Zustand solo para sesión y preferencias                                                                                                                                                                                              |
| Estado en URL        | Filtros, búsqueda, página, orden, fecha y pestaña: search params con esquema Zod                                                                                                                                                                          |
| Entorno              | `VITE_API_BASE_URL` en build; Zod lo valida y la app no arranca si es inválido                                                                                                                                                                            |
| Almacenamiento       | Claves `hj_admin.*` en `localStorage`                                                                                                                                                                                                                     |
| Estilos              | Solo tokens de `shared/ui/styles` (Tailwind v4): la paleta y la escala de texto por defecto de Tailwind están eliminadas. Cada valor nombra su origen en el tema Flutter; no inventar colores ni tamaños                                                  |
| Componentes          | Primitivas de `shared/ui` (shadcn/ui adaptado a Material 3 del panel Flutter); las features no estilan controles HTML crudos                                                                                                                              |
| Iconos               | Material Symbols vía `<Icon name>`; añadir el nombre Flutter (`Icons.*`) a `shared/ui/icons/icons.json` y `npm run icons:generate`. No editar `icons.gen.ts`                                                                                              |
| Modo oscuro          | Clase `.light`/`.dark` en un ancestro; la barra lateral es oscura en ambos modos (`--sidebar-*`)                                                                                                                                                          |
| Rutas con sesión     | Bajo `src/routes/_authed/`, con las rutas del panel Flutter. Cada pantalla declara `staticData: { screen }` con su cabecera en `features/shell/model/header.ts`; un test del árbol de rutas lo exige                                                      |
| Contenido localizado | Una query cuyo contenido localiza el backend lleva `meta: { localized: true }`: se vuelve a pedir al cambiar de idioma                                                                                                                                    |

## Plantilla de feature (Fase 4, `features/services`)

Las features siguientes copian su estructura; si algo no encaja, se corrige la plantilla.

| Pieza       | Regla                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model/`    | View model y presentación (formato, pill), esquema Zod de los search params, esquema del formulario y valores iniciales. Tests unitarios sin mocks                                                                                                                                                                                                                         |
| `api/`      | `*.keys.ts`, `*.queries.ts` (`meta.localized` si el backend localiza; `staleTime` corto para el traspaso loader → pantalla), `*.mutations.ts` (cada escritura invalida o guarda lo que cambia), `*.mappers.ts`                                                                                                                                                             |
| `hooks/`    | Un hook por pantalla: lee la URL (`useSearch`/`useParams` con `from`), queries, mutaciones y navegación. Recibe callbacks para toasts; no renderiza                                                                                                                                                                                                                        |
| `ui/`       | Pantallas con el kit; estados de carga, vacío y error en línea con reintentar. Tests con MSW sobre `renderApp`                                                                                                                                                                                                                                                             |
| Rutas       | `validateSearch` con el esquema del `model`; el loader solo precarga (`queryClient.query(...).catch(ignore)`) y no bloquea: la pantalla muestra su propio error                                                                                                                                                                                                            |
| Errores     | Queries: `EmptyState` con `useDescribeFailure(error)` y reintentar. Mutaciones: toast con contexto + clase (`useDescribeFailure(error, 'xFailed')`)                                                                                                                                                                                                                        |
| Formularios | React Hook Form + Zod, validación al enviar; `UnsavedChangesGuard` con `isDirty`. Al guardar un alta, `navigate` al detalle con `replace` e `ignoreBlocker`; al guardar una edición, `history.back({ ignoreBlocker: true })` vuelve al detalle de origen                                                                                                                   |
| Recursos    | Una feature por recurso del backend: `users` sirve `/admin/users` a personal y clientes, con las pantallas de cada rol en `ui/<rol>` y lo común en `ui/shared` (las features solo se importan `model` o UI). Un bloque de otro recurso dentro de una pantalla es un componente autocontenido de su feature (`appointments` exporta `UserAppointments`, con su propio hook) |
| Filtros     | En la URL; búsqueda con `useDebouncedText` (`shared/lib`, 350 ms, inmediata al vaciar); un filtro activo (también el de fecha) se ve como chip con ×                                                                                                                                                                                                                       |
| Chunks      | `npm run budget` limita cada chunk diferido a 60 kB gzip: una dependencia pesada de una sola pantalla va en su propio grupo de `codeSplitting` (`vite.config.ts`), como `phone` (libphonenumber-js y países)                                                                                                                                                               |

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
npm run icons:generate # Regenera icons.gen.ts desde icons.json
npm run icons:check    # Drift check de los iconos
npm run budget         # Presupuesto del bundle (tras build)
npm run docs:lint      # Valida docs/ con el motor OKF del hub
```

Imagen de producción (nginx, CSP incluida):

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t jordi-hidalgo-admin:local .
docker run --rm -p 8089:80 jordi-hidalgo-admin:local
PLAYWRIGHT_BASE_URL=http://localhost:8089 npm run e2e
```

## Escribir documentación

Al cambiar rutas, sesión, almacenamiento local o el despliegue, actualiza el documento de
[docs/index.md](docs/index.md) y la [matriz de cobertura](docs/coverage-matrix.md). Reglas en el hub
(`../knowledge-base-hub`, skill `okf-doc-writer`): `docs/` en inglés técnico, `status: draft` y
`generated` al editar, sin `verified`. `npm run docs:lint` debe dar `ERRORS: 0`.

## Tests

- `model` y `shared/lib`: unit tests de funciones puras, sin mocks.
- `api` + `hooks` + `ui`: tests con MSW en el borde de red (`src/test/msw`) y `renderWithProviders` (`src/test/render.tsx`).
- Playwright (`e2e/`) para los recorridos críticos.

## Archivos clave

| Archivo                                   | Para qué                                                                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/app.tsx`, `router.ts`            | Providers y router                                                                                                                                                            |
| `src/shared/api/client.ts`                | Cliente tipado y middleware                                                                                                                                                   |
| `src/shared/i18n/`                        | Mensajes, idioma, provider                                                                                                                                                    |
| `src/shared/ui/styles/`                   | Tokens, tema Tailwind, fuentes                                                                                                                                                |
| `src/shared/ui/primitives/`               | Primitivas del sistema visual                                                                                                                                                 |
| `src/routes/[_]kit.tsx`                   | `/_kit`: kit visual, solo en desarrollo                                                                                                                                       |
| `src/routes/_authed.tsx`                  | Guard de sesión y layout con el shell                                                                                                                                         |
| `src/features/shell/`                     | Barra lateral, drawer, cabecera móvil, preferencias y cabeceras por pantalla                                                                                                  |
| `src/features/services/`                  | Feature de referencia: plantilla de las siguientes                                                                                                                            |
| `src/features/users/`                     | `/admin/users` por rol: personal (`ui/staff`), clientes (`ui/clients`), `ui/shared`                                                                                           |
| `src/features/appointments/`              | Citas de las fichas y `AppointmentConflictsCheck` para los bloqueos (Fase 8 completa la feature)                                                                              |
| `src/features/schedule/`                  | Horarios, bloqueos puntuales y reglas recurrentes                                                                                                                             |
| `src/shared/lib/phone.ts`, `countries.ts` | Teléfonos como `app_core` (libphonenumber-js con metadatos completos) y países del picker (`countries.gen.ts`, `scripts/countries-import.mjs`)                                |
| `src/shared/lib/business-time.ts`         | Días del salón, instantes de la API, horas de reloj y formatos de fecha de Flutter                                                                                            |
| `src/shared/lib/date-filter.ts`           | Filtro de fecha de las listas (hoy, mes, rango); `use-date-filter.ts` lee la URL                                                                                              |
| `src/shared/ui/kit/`                      | Kit admin: `ListPage`, `DataTable`, `DateFilterField`, `DateInputField`, `TimePickerField`, `SegmentedTabs`, `SelectChips`, filtros, diálogos, guard, secciones, `PhoneField` |
| `src/shared/lib/failure.ts`               | Clase de error legible desde hooks y ui (sin importar `shared/api`)                                                                                                           |
| `src/shared/i18n/failure-message.ts`      | Mensaje por clase de error (`useDescribeFailure`)                                                                                                                             |
| `src/shared/config/env.ts`                | Variables de entorno                                                                                                                                                          |
| `eslint.config.js`                        | Reglas de capas y de copy                                                                                                                                                     |
| `deploy/*.template`, `Dockerfile`         | Imagen nginx de producción                                                                                                                                                    |
| `docs/index.md`                           | Mapa de la documentación del componente (ADR-002)                                                                                                                             |
