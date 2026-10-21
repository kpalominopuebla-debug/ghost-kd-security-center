import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { audit, getPool, isDbReady } from './database';
import { Roles } from './rbac';

// Datos demo cuando no hay DB (primer arranque sin postgres)
const memAssets = [
  { id: 'AST-001', name: 'Portal Web Principal', type: 'WEB', environment: 'STAGING', risk: 'MEDIUM' },
  { id: 'AST-002', name: 'API Principal', type: 'API', environment: 'STAGING', risk: 'MEDIUM' },
];

const memFindings = [
  { id: 'GKD-001', title: 'Missing authorization validation', severity: 'HIGH', status: 'NEW', asset: 'Portal Web Principal', confidence: 0.92 },
  { id: 'GKD-002', title: 'Security header review required', severity: 'MEDIUM', status: 'CONFIRMED', asset: 'Portal Web Principal', confidence: 0.88 },
  { id: 'GKD-003', title: 'Dependency update recommended', severity: 'LOW', status: 'IN_PROGRESS', asset: 'API Gateway', confidence: 0.81 },
];

const memScans: any[] = [];
const memAudit: any[] = [];
const memReports: any[] = [];

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const STATUSES = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'FIXED', 'RETEST', 'RESOLVED', 'FALSE_POSITIVE', 'ACCEPTED_RISK'];

function riskScore(sev: string, cvss?: number, confidence?: number): number {
  const base: Record<string, number> = { CRITICAL: 95, HIGH: 80, MEDIUM: 55, LOW: 25, INFO: 10 };
  let s = base[sev] ?? 30;
  if (typeof cvss === 'number') s = Math.round(s * 0.5 + cvss * 10 * 0.5);
  if (typeof confidence === 'number') s = Math.round(s * (0.7 + confidence * 0.3));
  return Math.max(0, Math.min(100, s));
}

@Controller()
export class SecurityController {
  @Get('dashboard')
  async dashboard() {
    if (isDbReady() && getPool()) {
      const pool = getPool()!;
      const [{ rows: a }, { rows: f }] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS c FROM assets WHERE active IS DISTINCT FROM FALSE'),
        pool.query('SELECT severity, status, COUNT(*)::int AS c FROM findings GROUP BY severity, status'),
      ]);
      let open = 0;
      const by: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      for (const r of f) {
        if (!['RESOLVED', 'FALSE_POSITIVE'].includes(r.status)) {
          open += r.c;
          if (by[r.severity] !== undefined) by[r.severity] += r.c;
        }
      }
      const score = Math.max(0, 100 - (by.CRITICAL * 15 + by.HIGH * 8 + by.MEDIUM * 3 + by.LOW * 1));
      return { score, assets: a[0]?.c ?? 0, openFindings: open, critical: by.CRITICAL, high: by.HIGH, medium: by.MEDIUM, low: by.LOW, source: 'db' };
    }
    return {
      score: 78,
      assets: memAssets.length,
      openFindings: memFindings.filter((f) => !['RESOLVED', 'FALSE_POSITIVE'].includes(f.status)).length,
      critical: memFindings.filter((f) => f.severity === 'CRITICAL').length,
      high: memFindings.filter((f) => f.severity === 'HIGH').length,
      medium: memFindings.filter((f) => f.severity === 'MEDIUM').length,
      low: memFindings.filter((f) => f.severity === 'LOW').length,
      source: 'memory',
    };
  }

  @Get('assets')
  async getAssets() {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT id, name, type, environment FROM assets ORDER BY created_at DESC LIMIT 200');
      return rows;
    }
    return memAssets;
  }

  @Roles('ANALYST')
  @Post('assets')
  async createAsset(@Body() body: { name: string; type: string; environment?: string; url?: string }) {
    if (!body?.name || !body?.type) throw new BadRequestException('name y type son obligatorios');
    if (isDbReady() && getPool()) {
      const id = randomUUID();
      await getPool()!.query(
        'INSERT INTO assets(id, name, type, environment, url) VALUES ($1,$2,$3,$4,$5)',
        [id, body.name, body.type, body.environment ?? 'STAGING', (body as any).url ?? null],
      );
      await audit('asset.create', 'asset', id, body);
      return { id, ...body, status: 'CREATED' };
    }
    const a = { id: `AST-${Date.now()}`, name: body.name, type: body.type, environment: body.environment ?? 'STAGING', risk: 'MEDIUM' };
    memAssets.push(a);
    memAudit.unshift({ action: 'asset.create', resource: a.id, at: new Date().toISOString() });
    return a;
  }

  @Get('findings')
  async getFindings() {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query(
        'SELECT f.id, f.title, f.severity, f.status, f.confidence, f.cvss, a.name AS asset FROM findings f LEFT JOIN assets a ON a.id = f.asset_id ORDER BY f.created_at DESC LIMIT 200',
      );
      return rows.map((r) => ({ ...r, riskScore: riskScore(r.severity, Number(r.cvss), Number(r.confidence)) }));
    }
    return memFindings.map((f) => ({ ...f, riskScore: riskScore(f.severity, undefined, (f as any).confidence) }));
  }

  @Get('findings/:id')
  async getFinding(@Param('id') id: string) {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT * FROM findings WHERE id = $1', [id]);
      if (!rows[0]) {
        // fallback a demo legacy GKD-xxx
        const legacy = memFindings.find((f) => f.id === id);
        if (legacy) return legacy;
        return { error: 'Finding not found' };
      }
      const { rows: hist } = await getPool()!.query(
        'SELECT old_status, new_status, changed_at FROM finding_status_history WHERE finding_id = $1 ORDER BY changed_at DESC LIMIT 20',
        [id],
      );
      return { ...rows[0], history: hist };
    }
    return memFindings.find((f) => f.id === id) ?? { error: 'Finding not found' };
  }

  @Roles('ANALYST')
  @Patch('findings/:id/status')
  async changeStatus(@Param('id') id: string, @Body() body: { status: string }) {
    if (!STATUSES.includes(body?.status)) throw new BadRequestException(`status inválido. Válidos: ${STATUSES.join(', ')}`);
    if (isDbReady() && getPool()) {
      const pool = getPool()!;
      const { rows } = await pool.query('SELECT status FROM findings WHERE id = $1', [id]);
      if (!rows[0]) throw new BadRequestException('Finding no existe en DB (usa IDs UUID de la DB, no GKD-xxx demo)');
      const old = rows[0].status;
      await pool.query('UPDATE findings SET status = $1, updated_at = NOW() WHERE id = $2', [body.status, id]);
      await pool.query('INSERT INTO finding_status_history(finding_id, old_status, new_status) VALUES ($1,$2,$3)', [id, old, body.status]);
      await audit('finding.status', 'finding', id, { from: old, to: body.status });
      return { id, from: old, to: body.status };
    }
    const f = memFindings.find((x) => x.id === id);
    if (!f) throw new BadRequestException('Finding not found');
    const from = f.status;
    f.status = body.status;
    memAudit.unshift({ action: `finding ${from} → ${body.status}`, resource: id, at: new Date().toISOString() });
    return { id, from, to: body.status };
  }

  @Get('scans')
  async listScans() {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT * FROM scans ORDER BY created_at DESC LIMIT 50');
      return rows;
    }
    return memScans;
  }

  @Roles('ANALYST')
  @Post('scans')
  async createScan(@Body() body: { assetId: string; type?: string }) {
    if (!body?.assetId) throw new BadRequestException('assetId es obligatorio y debe existir');
    const scanType = body.type ?? 'WEB';
    if (isDbReady() && getPool()) {
      const pool = getPool()!;
      const a = await pool.query('SELECT id FROM assets WHERE id = $1', [body.assetId]);
      if (!a.rows[0]) throw new BadRequestException('assetId no existe en la DB');
      const id = randomUUID();
      await pool.query("INSERT INTO scans(id, asset_id, scan_type, status) VALUES ($1,$2,$3,'QUEUED')", [id, body.assetId, scanType]);
      await audit('scan.create', 'scan', id, body);
      return { id, assetId: body.assetId, type: scanType, status: 'QUEUED', createdAt: new Date().toISOString() };
    }
    const s = { id: `SCAN-${Date.now()}`, assetId: body.assetId, type: scanType, status: 'QUEUED', createdAt: new Date().toISOString() };
    memScans.unshift(s);
    memAudit.unshift({ action: 'scan.create', resource: s.id, at: s.createdAt });
    return s;
  }

  @Get('audit')
  async getAudit() {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
      return rows;
    }
    return memAudit;
  }

  @Get('reports')
  async listReports() {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT * FROM reports ORDER BY created_at DESC LIMIT 50');
      return rows;
    }
    return memReports;
  }

  @Roles('ANALYST')
  @Post('reports')
  async createReport(@Body() body: { name: string; format?: string }) {
    if (!body?.name) throw new BadRequestException('name es obligatorio');
    const format = (body.format ?? 'PDF').toUpperCase();
    if (!['PDF', 'CSV', 'JSON'].includes(format)) throw new BadRequestException('format debe ser PDF, CSV o JSON');
    if (isDbReady() && getPool()) {
      const id = randomUUID();
      await getPool()!.query('INSERT INTO reports(id, name, format, status) VALUES ($1,$2,$3,$4)', [id, body.name, format, 'READY']);
      await audit('report.create', 'report', id, body);
      return { id, name: body.name, format, status: 'READY' };
    }
    const r = { id: `REP-${Date.now()}`, name: body.name, format, status: 'READY' };
    memReports.unshift(r);
    return r;
  }

  @Get('qa/:findingId')
  async getQa(@Param('findingId') findingId: string) {
    if (isDbReady() && getPool()) {
      const { rows } = await getPool()!.query('SELECT * FROM qa_tests WHERE finding_id = $1 ORDER BY created_at DESC', [findingId]);
      return rows;
    }
    // Plantilla QA generada para modo memoria
    return [
      { id: 'QA-001', finding_id: findingId, title: `Retest ${findingId}: verificar corrección`, preconditions: 'Entorno staging disponible', steps: '1. Reproducir evidencia 2. Aplicar fix 3. Re-escanear', expected_result: 'Finding pasa a FIXED y retest OK', status: 'PENDING' },
    ];
  }

  @Roles('ANALYST')
  @Post('intelligence/analyze')
  async analyze(@Body() body: { findingId: string; provider?: string }) {
    const enabled = String(process.env.AI_ENABLED || 'false') === 'true';
    if (!enabled) return { status: 'DISABLED', message: 'AI_ENABLED=false. Configura OPENAI_API_KEY o ANTHROPIC_API_KEY y pon AI_ENABLED=true' };
    if (!body?.findingId) throw new BadRequestException('findingId es obligatorio');
    const provider = body.provider ?? 'openai';
    if (!['openai', 'claude'].includes(provider)) throw new BadRequestException('provider debe ser openai o claude');
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) throw new BadRequestException('Falta OPENAI_API_KEY');
    if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) throw new BadRequestException('Falta ANTHROPIC_API_KEY');
    // Capa de integración lista: aquí se llamaría al proveedor con prompt versionado y validación de esquema.
    await audit('ai.analyze', 'finding', body.findingId, { provider });
    return { status: 'QUEUED', provider, findingId: body.findingId, note: 'Conector listo. Implementa la llamada HTTP al proveedor con sanitización de PII (ver docs/SECURITY.md).' };
  }

  @Get('meta')
  meta() {
    return {
      app: 'GHOST KD',
      version: '1.1.0',
      severities: SEVERITIES,
      statuses: STATUSES,
      lifecycle: 'NEW → CONFIRMED → IN_PROGRESS → FIXED → RETEST → RESOLVED (alt: FALSE_POSITIVE, ACCEPTED_RISK)',
      rbac: 'Envía header x-role: ADMIN|ANALYST|VIEWER. Escritura requiere ANALYST+. Sin header = VIEWER.',
    };
  }
}
