import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappService } from './whatsapp.service';
import { WhatsappQr, WhatsappQrSchema } from './whatsapp-qr.schema';
import { WhatsappController } from './whatsapp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsappQr.name, schema: WhatsappQrSchema },
    ]),
  ],
  providers: [WhatsappService],
  exports: [WhatsappService],
  controllers: [WhatsappController],
})
export class WhatsappModule {}
