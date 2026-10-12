# GHOST KD

Security. Visibility. Control.

GHOST KD is a security-center foundation for web applications. This package provides a runnable project structure with a Nuxt 3 + Quasar frontend, NestJS backend, PostgreSQL database, Docker Compose, RBAC foundation, assets, scans, findings, risk scoring, audit logs, reports, QA tests, and an AI Intelligence integration layer prepared for OpenAI and Claude.

## Requirements
- Docker Desktop
- Docker Compose
- Node.js 20+ (only needed if running frontend/backend outside Docker)

## Quick start with Docker
1. Copy `.env.example` to `.env`.
2. From this folder run:
   `docker compose up --build`
3. Frontend: http://localhost:3000
4. Backend API: http://localhost:3001/api/v1/health
5. PostgreSQL: localhost:5432

The AI providers are disabled until API keys are configured.

## Important
The scanners in this initial package are integration-ready foundations. Do not point active scanners at systems without authorization and a defined scope.
