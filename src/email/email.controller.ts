/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('welcome-account-creation')
  async sendWelcomeEmailAccountCreation(@Body() body: any): Promise<any> {
    const toEmail = body.to;
    const language = body.language; // 'fr' || 'en'
    const context = body.context; // userName && frontUrl
    return this.emailService.sendWelcomeEmailAccountCreation(
      toEmail,
      language,
      context,
    );
  }

  @Post('send-reset-pwd-email')
  async sendResetPwd(@Body() body: any): Promise<any> {
    const toEmail = body.to;
    const language = body.language; // 'fr' || 'en'
    const context = body.context; // userName && resetPwdUrl
    return this.emailService.sendResetPwd(toEmail, language, context);
  }
}
