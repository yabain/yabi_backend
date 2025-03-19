/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  templateFolder: any = path.join(__dirname, '..', '..', 'email', 'templates');

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: environment.EMAIL_SERVICE,
      auth: {
        user: environment.EMAIL_USER,
        pass: environment.EMAIL_PASSWORD,
      },
    });
  }
  async sendWelcomeEmailAccountCreation(
    toEmail: string,
    language: string, // 'fr' || 'en'
    context: Record<string, any>, // userName && frontUrl
  ): Promise<void> {
    const templateName = 'welcome-email';
    let subject: string = '';
    if (language === 'fr') {
      subject = 'Bienvenue sur Yabi Events';
    } else subject = 'Welcome to Yabi Events';
    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template(context);

    await this.transporter.sendMail({
      from: environment.EMAIL_USER,
      to: toEmail,
      subject,
      html,
    });
  }

  async sendResetPwd(
    toEmail: string,
    language: string, // 'fr' || 'en'
    context: Record<string, any>, // userName && resetPwdUrl
  ): Promise<void> {
    let subject: string = '';
    const templateName = 'reset-pwd';
    if (language === 'fr') {
      subject = 'Réinitialisation de Mot de Passe';
    } else language = 'Password Reset';
    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    const html = template(context);

    console.log('Ici le test', environment.EMAIL_USER, toEmail, subject);
    await this.transporter.sendMail({
      from: environment.EMAIL_USER,
      to: toEmail,
      subject,
      html,
    });
  }
}
