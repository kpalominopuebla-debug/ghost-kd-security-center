# GHOST KD

Security. Visibility. Control.

GHOST KD es un security-center fundacional: frontend **Nuxt 3 + Quasar**, backend **NestJS**, **PostgreSQL**, **Docker Compose**, RBAC básico, assets, scans, findings, risk scoring, audit logs, reports, QA e integración IA (OpenAI / Claude).

## Requisitos
- Docker Desktop + Docker Compose
- Node.js 20+ (solo si corres fuera de Docker)

## Arranque rápido con Docker
1. Copia `.env.example` a `.env`.
2. Desde esta carpeta: `docker compose up --build`
3. Frontend: http://localhost:3000
4. Backend: http://localhost:3001/api/v1/health — Meta: http://localhost:3001/api/v1/meta
5. PostgreSQL: localhost:5432

La IA está desactivada hasta configurar keys (`AI_ENABLED=true` + `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`).

## API principal (prefijo `/api/v1`)
- `GET /dashboard` — score, conteos (fuente `db` o `memory`)
- `GET /assets` / `POST /assets` (ANALYST, header `x-role`)
- `GET /findings` / `GET /findings/:id` / `PATCH /findings/:id/status` (ANALYST)
- `GET /scans` / `POST /scans` (ANALYST) — body `{ assetId, type }`
- `GET /audit` — últimas 100 acciones
- `GET /reports` / `POST /reports` (ANALYST) — `{ name, format: PDF|CSV|JSON }`
- `GET /qa/:findingId` — plantilla/tests QA
- `POST /intelligence/analyze` (ANALYST) — `{ findingId, provider: openai|claude }`
- `GET /meta` — severidades, estados, ciclo de vida

RBAC: envía `x-role: ADMIN|ANALYST|VIEWER` (sin header = VIEWER). Escritura requiere ANALYST+.

Estados: `NEW → CONFIRMED → IN_PROGRESS → FIXED → RETEST → RESOLVED` (alt: `FALSE_POSITIVE`, `ACCEPTED_RISK`).

## Desarrollo local (sin Docker)
```bash
# Backend
cd backend && npm install --include=dev && npm run build && npm test
DATABASE_URL=postgresql://ghost_kd:change_me@localhost:5432/ghost_kd npm start

# Frontend
cd frontend && npm install && npm run dev
```

## OpenCode
Este repo incluye `opencode.json` + `AGENTS.md`. En tu laptop:
```bash
cd ghost-kd-security-center
opencode
# /init ya hecho — usa /connect para tu provider, TAB para Plan/Build
```

## Seguridad
Ver `docs/SECURITY.md`. No apuntes scans activos a sistemas sin autorización y alcance definido. Nunca subas `.env` ni keys.
