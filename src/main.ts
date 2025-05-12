/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const assetsPath =
    process.env.NODE_ENV === 'production'
      ? '/app/assets'
      : join(__dirname, '..', '..', 'assets');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Middleware de logging (optionnel)
  app.use((req, res, next) => {
    // console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Configuration CORS renforcée
  // app.enableCors({
  //   origin: [
  //     'http://localhost',
  //     'https://localhost',
  //     'http://localhost:8100',
  //     'https://localhost:8100',
  //     'http://localhost:4200',
  //     'https://localhost:4200',
  //     'https://yabi.cm',
  //     'http://yabi.cm',
  //     'https://app.yabi.cm',
  //     'http://app.yabi.cm',
  //     'https://web.yabi.cm',
  //     'http://web.yabi.cm',
  //     'capacitor://localhost',
  //     'ionic://localhost',
  //     '*',
  //   ],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: [
  //     'Content-Type',
  //     'Authorization',
  //     'Accept',
  //     'X-Requested-With',
  //     'Origin',
  //   ],
  //   exposedHeaders: ['Authorization', 'Content-Length'],
  //   // credentials: true,
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });
  app.enableCors({
    origin: true, // Autoriser toutes les origines
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['Authorization', 'Content-Length'],
    credentials: true, // Si vous avez besoin des cookies/sessions
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
  app.useStaticAssets(assetsPath, {
    prefix: '/assets',
  });

  app.useStaticAssets(assetsPath, {
    prefix: '/uploads',
  });

  // Par ceci :
  app.useStaticAssets(join(assetsPath, 'images'), {
    prefix: '/uploads',
    index: false,
  });

  app.useStaticAssets(assetsPath, {
    prefix: '/assets',
    index: false,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Yabi API')
    .setDescription('Yabi API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Yabi backend Application is running on: ${await app.getUrl()}`);
}

bootstrap();
