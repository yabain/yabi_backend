import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Country } from 'src/country/country.schema';
import mongoose from 'mongoose';

export enum UserType {
  PERSONAL = 'personal',
  ORGANISATION = 'organisation',
}

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ unique: true })
  email: string;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  accountType: UserType;

  @Prop()
  password: string;

  @Prop()
  agreeTerms: boolean;

  @Prop()
  verified: boolean;

  @Prop()
  vip: boolean;

  @Prop()
  warning: boolean;

  @Prop()
  isAdmin: boolean;

  @Prop()
  active: boolean;

  @Prop()
  status: boolean;

  @Prop()
  premium: boolean;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  language: string; // en || fr

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'City' })
  cityId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Country' })
  countryId: Country;

  @Prop()
  phone: string;

  @Prop()
  pictureUrl: string;

  @Prop()
  coverUrl: string;

  @Prop()
  phone2: string;

  @Prop()
  whatsapp: string;

  @Prop()
  twitter: string;

  @Prop()
  instagram: string;

  @Prop()
  facebook: string;

  @Prop()
  website: string;

  @Prop()
  linkedIn: string;

  @Prop()
  address: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
