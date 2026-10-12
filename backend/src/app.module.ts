import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SecurityController } from './security.controller';

@Module({
  controllers: [HealthController, SecurityController],
})
export class AppModule {}
