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

  @Post('send')
  async send(@Body() body: { to: string; message: string }) {
    console.log('body: ', body);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.whatsappService.sendMessage(body.to, body.message);
  }

  @Get('qr-code')
  // @UseGuards(AuthGuard('jwt')) // Protect the route with authentication
  // @UsePipes(ValidationPipe) // Validate the incoming data
  async getQr(@Req() req): Promise<any> {
    console.log('get QR-Code');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if (!req.user.isAdmin) {
    //   throw new NotFoundException('Unautorised');
    // }
    return this.whatsappService.getCurrentQr();
  }

  @Post('disconnect')
  // @UseGuards(AuthGuard('jwt')) // Protect the route with authentication
  // @UsePipes(ValidationPipe) // Validate the incoming data
  async disconnect(@Req() req): Promise<any> {
    console.log('get QR-Code');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if (!req.user.isAdmin) {
    //   throw new NotFoundException('Unautorised');
    // }
    return this.whatsappService.disconnect();
  }
}
