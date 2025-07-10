import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WhatsappQr extends Document {
  @Prop({ required: true })
  qr: string;
}

export const WhatsappQrSchema = SchemaFactory.createForClass(WhatsappQr);
