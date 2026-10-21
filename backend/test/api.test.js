const { test } = require('node:test');
const assert = require('node:assert');
// Test de contrato: verifica que el controlador exporta las rutas esperadas (smoke test sin DB)
test('contrato de rutas GHOST KD', () => {
  const src = require('fs').readFileSync('./src/security.controller.ts', 'utf8');
  for (const r of ["dashboard", "assets", "findings", "scans", "audit", "reports", "qa/:findingId", "intelligence/analyze", "meta"]) {
    assert.ok(src.includes(r), `falta ruta ${r}`);
  }
});
