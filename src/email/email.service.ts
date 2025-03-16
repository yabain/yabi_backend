/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { environment } from 'env';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurez le transporteur Nodemailer
    this.transporter = nodemailer.createTransport({
      service: environment.EMAIL_SERVICE, // Utilisez votre service d'email (Gmail, Outlook, etc.)
      auth: {
        user: environment.EMAIL_USER, // Email de l'expéditeur
        pass: environment.EMAIL_PASSWORD, // Mot de passe de l'email
      },
    });
  }

  /**
   * Envoie un email en utilisant un template Handlebars.
   * @param to - L'adresse email du destinataire.
   * @param subject - Le sujet de l'email.
   * @param templateName - Le nom du template (sans extension).
   * @param context - Les variables à injecter dans le template.
   * @returns Une promesse résolue lorsque l'email est envoyé.
   */
  async sendEmailWithTemplate(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ): Promise<void> {
    // Chargez le template Handlebars
    const templatePath = path.join(
      __dirname,
      '..', // Remonte d'un niveau (src -> dist)
      'src',
      'email',
      'templates',
      `${templateName}.html`,
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    // Remplissez le template avec les variables
    const html = template(context);

    // Envoyez l'email
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  }
}
