/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use((req, res, next) => {
    // console.log('Incoming Request:', {
    //   method: req.method,
    //   url: req.url,
    //   headers: req.headers,
    //   body: req.body,
    // });
    next();
  });

  app.enableCors({
    origin: ['http://localhost:8100', 'https://app.yabi.cm', 'https://yabi.cm'], // Autorise uniquement ces domaines
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
    credentials: true,
  });

  // Activer le ValidationPipe globalement
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servir les fichiers statiques depuis le dossier 'assets/images'
  app.useStaticAssets(join(__dirname, '..', '..', 'assets'), {
    prefix: '/assets',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
