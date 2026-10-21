# AGENTS.md — GHOST KD Security Center

> Stack: Nuxt 3 + Quasar (frontend :3000) | NestJS (backend :3001/api/v1) | PostgreSQL :5432 | Docker Compose | RBAC | Scans/Findings/Risk/Audit/Reports/QA | AI layer OpenAI + Claude
> Idioma de respuesta: **Español**. Commits en español, claros y atómicos.

## Arranque rápido
1. Copiar `.env.example` a `.env` y rellenar claves (nunca subir `.env`).
2. `docker compose up --build`
3. Frontend: http://localhost:3000 — Backend health: http://localhost:3001/api/v1/health
4. AI providers OFF hasta configurar `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.

## Reglas OpenCode para este repo
- No apuntar scanners activos a sistemas sin autorización y alcance definido.
- Frontend: respetar estructura Nuxt 3 + Quasar (pages, components, stores, plugins).
- Backend: NestJS modular (modules, controllers, services, dto, guards). Validar todo con class-validator.
- DB: PostgreSQL vía Docker. Migraciones versionadas, no SQL suelto. Datos sensibles solo por variables de entorno.
- RBAC: verificar guards/roles en cada endpoint nuevo. Mínimo privilegio por defecto.
- Findings/Risk: score reproducible y documentado. No inventar severidades.
- Audit logs: toda acción sensible debe dejar traza (quién, qué, cuándo, IP).
- Tests QA: `npm test` debe pasar antes de cada push. Añadir test a cada fix/feature.
- Formato: Prettier. Lint antes de commit.
- Seguridad: nunca commitear `.env`, `*.pem`, `*.key`. Revisar `.gitignore`.

## Flujo GitHub (main protegida)
- Rama: `feat/nombre-corto` desde `main` actualizada.
- Antes de push: `docker compose config --quiet` + `npm run lint` + `npm test` (frontend y backend si aplica).
- Commit ejemplo: `feat(scans): agrega escaneo pasivo con límite de alcance`
- Push + PR: `gh pr create --fill --title "..." --body "Qué cambia, cómo probar, riesgo"`
- Prohibido: `push --force` a `main`, scanners contra prod, subir secretos.

## Prompts útiles
- `@backend/src explícame el módulo de findings y su risk scoring`
- `Crea un plan para terminar el módulo de reports sin romper RBAC`
- `Revisa audit logs: ¿qué acciones críticas no tienen traza? Propón el parche`
- `Haz QA: lista endpoints sin test y genera los tests faltantes`

## Definición de "terminado"
- [ ] `docker compose up --build` levanta sin errores
- [ ] /health OK, frontend carga, login RBAC funciona
- [ ] Scans → findings → risk → reports fluye end-to-end (aunque sea con datos mock)
- [ ] Audit logs registran, QA tests en verde, README actualizado
- [ ] Sin secretos en el repo (`git grep -i "sk-ant\|sk-proj\|AKIA\|BEGIN PRIVATE"` vacío)

## No tocar sin permiso
`node_modules/`, `dist/`, `.nuxt/`, `.quasar/`, `*.db`, versiones en `package.json`, infra prod.
