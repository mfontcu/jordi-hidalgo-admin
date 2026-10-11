# Hidalgo Junior — panel de administración

Panel de administración del salón en React + TypeScript (Vite, TanStack Router y Query, react-intl). Sustituirá al panel Flutter cuando alcance la paridad. Arquitectura en ADR-003 del hub de conocimiento; guía de trabajo en [AGENTS.md](AGENTS.md).

## Arranque local

Requiere Node 24 y el backend (`jordi_hidalgo_backend`) en `http://localhost:8080`.

```bash
npm install
npm run dev     # http://localhost:5173
```

## Comprobaciones

```bash
npm run check   # typecheck, lint, formato, contrato, mensajes, tests, build, bundle, e2e
```

Lista completa de comandos en [AGENTS.md](AGENTS.md#comandos).
