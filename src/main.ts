import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Activer CORS
  app.enableCors({
    origin: '*', // Autoriser uniquement les requêtes depuis ce domaine
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Méthodes HTTP autorisées
    allowedHeaders:
      'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization', // En-têtes autorisés
    credentials: true, // Autoriser les cookies et les en-têtes d'authentification
  });

  // Activer le ValidationPipe globalement
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Servir les fichiers statiques depuis le dossier 'uploads'
  app.useStaticAssets(join(__dirname, '..', 'assets', 'images'), {
    prefix: '/assets/images',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
