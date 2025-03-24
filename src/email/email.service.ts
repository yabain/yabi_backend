/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private transporterSupport: nodemailer.Transporter;
  private readonly templateFolder = path.join(
    __dirname,
    '..',
    '..',
    'email',
    'templates',
  );

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('EMAIL_TEAM'),
        pass: this.configService.get<string>('PASSWORD_TEAM'),
      },
    });

    this.transporterSupport = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      auth: {
        user: this.configService.get<string>('EMAIL_SUPPORT'),
        pass: this.configService.get<string>('PASSWORD_SUPPORT'),
      },
    });
  }

  async sendWelcomeEmailAccountCreation(
    toEmail: string,
    language: string,
    userName: string,
  ): Promise<void> {
    const templateName = 'welcome-email';
    const subject =
      language === 'fr'
        ? 'Bienvenue sur Yabi Events'
        : 'Welcome to Yabi Events';

    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const context = {
      frontUrl: this.configService.get<string>('FRONT_URL'),
      userName,
    };

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    const html = template(context);

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_TEAM'),
      to: toEmail,
      subject,
      html,
    });
  }

  async sendResetPwd(
    toEmail: string,
    language: string,
    userName: string,
    token: string,
  ): Promise<boolean> {
    const templateName = 'reset-pwd';
    const subject =
      language === 'fr' ? 'Réinitialisation de Mot de Passe' : 'Password Reset';

    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const context = {
      userName,
      resetPwdUrl: `${this.configService.get<string>('FRONT_URL')}/auth-screen/new-password${token}`,
    };

    const html = template(context);

    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_TEAM'),
      to: toEmail,
      subject,
      html,
    });

    return true;
  }
}
