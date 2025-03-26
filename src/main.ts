/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Middleware de logging (optionnel)
  app.use((req, res, next) => {
    // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Configuration CORS renforcée
  app.enableCors({
    origin: [
      'http://localhost:8100', // Ionic en dev
      'https://yabi.cm', // Production
      'https://app.yabi.cm', // Production
      'capacitor://localhost', // Pour les apps mobiles
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['Authorization', 'Content-Length'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Gestion spécifique des requêtes OPTIONS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept',
      );
      return res.status(204).send();
    }
    next();
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Fichiers statiques
  app.useStaticAssets(join(__dirname, '..', '..', 'assets'), {
    prefix: '/assets',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
