import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { initDb } from './database';
import { RolesGuard } from './rbac';

async function bootstrap() {
  await initDb();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalGuards(new RolesGuard(new Reflector()));
  await app.listen(process.env.PORT || 3001);
  console.log(`GHOST KD backend en puerto ${process.env.PORT || 3001}`);
}
bootstrap();
