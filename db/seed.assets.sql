-- GHOST KD — Plantilla de activos reales
-- Copia este archivo como seed.assets.sql y ajusta con tus activos.
-- Se ejecuta con: psql $DATABASE_URL -f db/seed.assets.sql
--
-- Columnas: name, type (WEB|API|MOBILE|INFRA), environment (DEV|STAGING|PROD), url, criticality (1-5)

-- Limpia ejemplos demo (solo si quieres partir de cero):
-- DELETE FROM findings; DELETE FROM scans; DELETE FROM assets;

INSERT INTO assets (id, name, type, environment, url, criticality) VALUES
  (gen_random_uuid(), 'Portal Web Principal', 'WEB', 'PROD', 'https://ejemplo.com', 4),
  (gen_random_uuid(), 'API Principal', 'API', 'PROD', 'https://api.ejemplo.com', 5)
ON CONFLICT DO NOTHING;

-- Ejemplo para añadir un tercero:
-- INSERT INTO assets (id, name, type, environment, url, criticality) VALUES
--   (gen_random_uuid(), 'App Móvil', 'MOBILE', 'PROD', 'https://play.google.com/store/...', 3);
