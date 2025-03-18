/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  /**
   * Get all users with optional query parameters for filtering and pagination.
   * @param query - Query parameters for filtering and pagination.
   * @returns A list of users.
   */
  @Post('welcome-account-creation')
  async sendWelcomeEmailAccountCreation(@Body() body: any): Promise<any> {
    console.log('data du body: ', body)
    const toEmail = body.to;
    const templateName = body.templateName;
    const language = body.language; // 'fr' || 'en'
    const context = body.context; // userName && frontUrl
    return this.emailService.sendWelcomeEmailAccountCreation(
      toEmail,
      templateName,
      language,
      context,
    );
  }
}
