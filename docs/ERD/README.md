# ERD — GHOST KD

Relaciones principales:

User 1:N AuditLog
User N:M Role mediante UserRole
Asset 1:N Scan
Asset 1:N Finding
Scan 1:N Finding
Finding 1:N FindingStatusHistory
Finding 1:N Alert
Finding 1:N QATest
Finding 1:N AIRequest

La base de datos física se encuentra en `db/schema.sql`.
