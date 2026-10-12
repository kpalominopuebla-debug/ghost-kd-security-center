# UML — GHOST KD

## Casos de uso principales
- Autenticarse
- Gestionar usuarios y roles
- Registrar y gestionar activos
- Ejecutar análisis
- Consultar findings
- Cambiar estado de finding
- Solicitar retest
- Consultar dashboard
- Gestionar alertas
- Generar reportes
- Analizar findings con GHOST KD Intelligence
- Generar pruebas QA
- Consultar auditoría

## Ciclo de vida de un finding
NEW → CONFIRMED → IN_PROGRESS → FIXED → RETEST → RESOLVED

Alternativas:
- FALSE_POSITIVE
- ACCEPTED_RISK

## Secuencia de scan
Usuario → API → autorización/RBAC → Scan Service → Scanner Engine → Normalizer → Deduplicator → Risk Engine → AI Intelligence → Finding → Dashboard.
