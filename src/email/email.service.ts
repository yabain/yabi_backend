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
    this.transporter = nodemailer.createTransport({
      service: environment.EMAIL_SERVICE,
      auth: {
        user: environment.EMAIL_USER,
        pass: environment.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmailWithTemplate(
    toEmail: string,
    subject: string,
    templateName: string,
    language: string,
    context: Record<string, any>,
  ): Promise<void> {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'email',
      'templates',
      `${templateName}_${language}.hbs`,
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    // Remplissez le template avec les variables
    const html = template(context);

    // Envoyez l'email
    await this.transporter.sendMail({
      from: environment.EMAIL_USER,
      toEmail,
      subject,
      html,
    });
  }

  async sendWelcomeEmailAccountCreation(
    toEmail: string,
    templateName: string,
    language: string,
    context: Record<string, any>,
  ): Promise<void> {
    let subject: string = '';
    if (language === 'fr') {
      subject = 'Bienvenue sur Yabi Events';
    } else subject = 'Welcome to Yabi Events';
    // Chargez le template Handlebars
    const templatePath = path.join(
      __dirname,
      '..', // Remonte d'un niveau (src -> dist)
      '..',
      'email',
      'templates',
      `${templateName}_${language}.hbs`,
    );

    console.log('Ici le test', environment.EMAIL_USER, toEmail, subject, language);

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    // Remplissez le template avec les variables
    const html = template(context);

    console.log('Ici le test', environment.EMAIL_USER, toEmail, subject);
    // Envoyez l'email
    await this.transporter.sendMail({
      from: environment.EMAIL_USER,
      to: toEmail,
      subject,
      html,
    });
  }

  async sendResetPwd(
    toEmail: string,
    templateName: string,
    language: string,
    context: Record<string, any>,
  ): Promise<void> {
    let subject: string = '';
    if (language === 'fr') {
      subject = 'Réinitialisation de Mot de Passe';
    } else language = 'Password Reset';
    // Chargez le template Handlebars
    const templatePath = path.join(
      __dirname,
      '..', // Remonte d'un niveau (src -> dist)
      '..',
      'email',
      'templates',
      `${templateName}_${language}.hbs`,
    );

    console.log('Ici le test', environment.EMAIL_USER, toEmail, subject);

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    // Remplissez le template avec les variables
    const html = template(context);

    console.log('Ici le test', environment.EMAIL_USER, toEmail, subject);
    // Envoyez l'email
    await this.transporter.sendMail({
      from: environment.EMAIL_USER,
      to: toEmail,
      subject,
      html,
    });
  }
}
