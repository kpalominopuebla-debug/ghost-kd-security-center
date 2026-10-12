import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      application: 'GHOST KD',
      status: 'ok',
      service: 'backend',
      version: '1.0.0'
    };
  }
}
