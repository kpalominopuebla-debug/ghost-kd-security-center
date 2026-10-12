# Arquitectura

Frontend (Nuxt 3 + Quasar)
        ↓
Backend API (NestJS)
        ↓
Security Engines
  ├── ZAP / DAST
  ├── Nuclei
  ├── Semgrep / SAST
  ├── Trivy
  ├── Nmap
  └── TLS / Headers
        ↓
Finding Normalizer
        ↓
Deduplication / Correlation
        ↓
Risk Engine
        ↓
GHOST KD Intelligence
  ├── OpenAI
  └── Claude
        ↓
QA / Remediation / Reports
        ↓
PostgreSQL

Regla: la IA interpreta evidencia; no sustituye controles deterministas ni debe ejecutar comandos sin autorización explícita.
