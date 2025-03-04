import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '../user/user.schema';
import mongoose from 'mongoose';
import { Document } from 'mongoose';

export enum EventType {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface TicketClass {
  id: string;
}

@Schema({
  timestamps: true,
})
export class Event extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  autor: User;

  @Prop()
  title: string;

  @Prop()
  cover: string;

  @Prop()
  dateStart: Date;

  @Prop()
  dateEnd: Date;

  @Prop()
  timeStart: string;

  @Prop()
  timeEnd: string;

  @Prop()
  type: EventType;

  @Prop([{ type: Object }])
  ticketClasses: TicketClass[];

  @Prop()
  description: string;

  @Prop()
  status: boolean;

  @Prop()
  paid: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'City' })
  cityId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Country' })
  countryId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
  categoryId: string;

  @Prop()
  location: string;

  @Prop()
  agreeTerms: boolean;

  @Prop()
  phone: string;

  @Prop()
  phone2: number;

  @Prop()
  onlineMeet: string;

  @Prop()
  whatsapp: string;

  @Prop()
  twitter: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  externalLink: string;

  @Prop()
  linkedIn: string;

  @Prop()
  email: string;

  @Prop()
  address: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
