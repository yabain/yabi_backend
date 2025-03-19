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
  private transporterSupport: nodemailer.Transporter;
  templateFolder: any = path.join(__dirname, '..', '..', 'email', 'templates');

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: environment.EMAIL_SERVICE,
      auth: {
        user: environment.EMAIL_TEAM,
        pass: environment.PASSWORD_TEAM,
      },
    });

    this.transporterSupport = nodemailer.createTransport({
      service: environment.EMAIL_SERVICE,
      auth: {
        user: environment.EMAIL_SUPPORT,
        pass: environment.PASSWORD_SUPPORT,
      },
    });
  }

  async sendWelcomeEmailAccountCreation(
    toEmail: string,
    language: string, // 'fr' || 'en'
    userName: string,
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
    const context: any = {
      frontUrl: environment.FRONT_URL,
      userName: userName,
    };

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const html = template(context);

    await this.transporter.sendMail({
      from: environment.EMAIL_TEAM,
      to: toEmail,
      subject,
      html,
    });
  }

  async sendResetPwd(
    toEmail: string, // User email
    language: string, // 'fr' || 'en'
    userName: string,
    token: string,
  ): Promise<void> {
    let subject: string = '';
    const templateName = 'reset-pwd';
    if (language === 'fr') {
      subject = 'Réinitialisation de Mot de Passe';
    } else subject = 'Password Reset';
    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const context: any = {
      resetPwdUrl: environment.FRONT_URL + '/reset-password' + token,
      userName: userName,
    };
    const html = template(context);
    await this.transporterSupport.sendMail({
      from: environment.EMAIL_TEAM,
      to: toEmail,
      subject,
      html,
    });
  }
}
