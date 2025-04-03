/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import { DateService } from './date.service';

const OAuth2 = google.auth.OAuth2;
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly templateFolder = path.join(
    __dirname,
    '..',
    '..',
    'email',
    'templates',
  );

  constructor(
    private readonly configService: ConfigService,
    private dateService: DateService,
  ) {
    this.initializeTransporter();
    // this.transporter = nodemailer.createTransport({
    //   service: this.configService.get<string>('EMAIL_SERVICE'),
    //   auth: {
    //     user: this.configService.get<string>('EMAIL_TEAM'),
    //     pass: this.configService.get<string>('PASSWORD_TEAM'),
    //   },
    // });
  }

  private async initializeTransporter() {
    const oauth2Client = new OAuth2(
      this.configService.get<string>('OAUTH_CLIENT_ID'),
      this.configService.get<string>('OAUTH_CLIENT_SECRET'),
      this.configService.get<string>('OAUTH_REDIRECT_URL') ||
        'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: this.configService.get<string>('OAUTH_REFRESH_TOKEN'),
    });

    const accessToken = await new Promise<string>((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err || !token) {
          reject(new Error('Failed to create access token'));
          return;
        }
        resolve(token.toString());
      });
    });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get<string>('EMAIL_TEAM'),
        clientId: this.configService.get<string>('OAUTH_CLIENT_ID'),
        clientSecret: this.configService.get<string>('OAUTH_CLIENT_SECRET'),
        refreshToken: this.configService.get<string>('OAUTH_REFRESH_TOKEN'),
        accessToken: accessToken,
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

  async sendEventParticipationEmail(
    toEmail: string,
    language: string,
    userName: string,
    event: any,
  ): Promise<boolean> {
    const templateName = 'participate-free-event';
    const subject =
      language === 'fr'
        ? 'Participation à un événement'
        : 'Event participation';

    const templatePath = path.join(
      this.templateFolder,
      `${templateName}_${language}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);

    const context = {
      userName,
      cover_img: event.eventData.cover,
      event_title: event.eventData.title,
      event_category: event.categoryData.name,
      event_price: event.eventData.paid === true ? event.price : 'FREE',
      event_description: event.eventData.description,
      event_country: event.countryData.name,
      event_city: event.cityData.name,
      event_location: event.eventData.location,
      event_start:
        this.dateService.formatDate(event.eventData.dateStart, language) +
        ' - ' +
        this.dateService.formatTime(event.eventData.dateStart, language),
      event_end:
        this.dateService.formatDate(event.eventData.dateEnd, language) +
        ' - ' +
        this.dateService.formatTime(event.eventData.dateEnd, language),
      event_url: `${this.configService.get<string>('FRONT_URL')}/tabs/events/${event.eventData._id}_shared`,
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
