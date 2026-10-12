import { Body, Controller, Get, Param, Post } from '@nestjs/common';

const assets = [
  { id: 'AST-001', name: 'MaxiHabana', type: 'WEB', environment: 'STAGING', risk: 'HIGH' },
  { id: 'AST-002', name: 'API Gateway', type: 'API', environment: 'STAGING', risk: 'MEDIUM' }
];

const findings = [
  { id: 'GKD-001', title: 'Missing authorization validation', severity: 'HIGH', status: 'NEW', asset: 'MaxiHabana', confidence: 0.92 },
  { id: 'GKD-002', title: 'Security header review required', severity: 'MEDIUM', status: 'CONFIRMED', asset: 'MaxiHabana', confidence: 0.88 },
  { id: 'GKD-003', title: 'Dependency update recommended', severity: 'LOW', status: 'IN_PROGRESS', asset: 'API Gateway', confidence: 0.81 }
];

@Controller()
export class SecurityController {
  @Get('dashboard')
  dashboard() {
    return {
      score: 78,
      assets: assets.length,
      openFindings: findings.filter(f => !['RESOLVED', 'FALSE_POSITIVE'].includes(f.status)).length,
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length
    };
  }

  @Get('assets')
  getAssets() { return assets; }

  @Get('findings')
  getFindings() { return findings; }

  @Get('findings/:id')
  getFinding(@Param('id') id: string) {
    return findings.find(f => f.id === id) ?? { error: 'Finding not found' };
  }

  @Post('scans')
  createScan(@Body() body: { assetId: string; type?: string }) {
    return {
      id: `SCAN-${Date.now()}`,
      assetId: body.assetId,
      type: body.type ?? 'WEB',
      status: 'QUEUED',
      createdAt: new Date().toISOString()
    };
  }
}
