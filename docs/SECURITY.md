# Seguridad de GHOST KD

Principios:
1. RBAC y autorización del lado servidor.
2. No confiar en permisos enviados por el frontend.
3. No almacenar API keys de proveedores de IA en PostgreSQL.
4. Sanitizar secretos, tokens, cookies y PII antes de enviar datos a modelos externos.
5. Validar y limitar el alcance de cada scan.
6. Registrar acciones administrativas en audit logs.
7. Validar respuestas de IA mediante esquema antes de persistirlas.
8. No ejecutar comandos generados por IA directamente.
9. Retests deben quedar asociados al finding original.
10. Los scanners deben utilizarse solamente contra activos autorizados.
