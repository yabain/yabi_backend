/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UsePipes,
  NotFoundException,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('init-whatsapp')
  @UseGuards(AuthGuard('jwt')) // Protect the route with authentication
  @UsePipes(ValidationPipe) // Validate the incoming data
  async initWhatsapp(@Req() req) {
    if (!req.user.isAdmin) {
      throw new NotFoundException('Unautorised');
    }
    return this.whatsappService.initWhatsapp();
  }

  @Get('get-qr-code')
  // @UseGuards(AuthGuard('jwt'))
  // @UsePipes(ValidationPipe)
  async getQr(@Req() req): Promise<any> {
    console.log('get QR-Code');
    if (!req.user.isAdmin) {
      throw new NotFoundException('Unautorised');
    }
    return this.whatsappService.getCurrentQr();
  }

  @Get('refresh-qr-code')
  // @UseGuards(AuthGuard('jwt'))
  // @UsePipes(ValidationPipe)
  async refreshQr(@Req() req): Promise<any> {
    console.log('get QR-Code');
    if (!req.user.isAdmin) {
      throw new NotFoundException('Unautorised');
    }
    return this.whatsappService.refreshQr();
  }

  @Post('send')
  // @UseGuards(AuthGuard('jwt'))
  // @UsePipes(ValidationPipe)
  async send(@Body() body: { to: string; message: string; code: string }) {
    console.log('body: ', body);
    return this.whatsappService.sendMessage(body.to, body.message, body.code);
  }

  @Post('welcome-message')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async welcomeMessage(@Req() req) {
    return this.whatsappService.welcomeMessage(req.user._id, false); // true if user data with countryId.code, false if just userId
  }

  @Post('welcome-message0')
  async welcomeMessage0(@Body() body: { userId: string }) {
    return this.whatsappService.welcomeMessage(body.userId, false); // true if user data with countryId.code, false if just userId
  }

  @Post('disconnect')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async disconnect(@Req() req): Promise<any> {
    console.log('disconnect');
    if (!req.user.isAdmin) {
      throw new NotFoundException('Unautorised');
    }
    return this.whatsappService.disconnect();
  }
}
