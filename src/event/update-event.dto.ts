import { User } from '../user/user.schema';
import { EventType } from './event.schema';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmpty,
  IsNumber,
  // IsDate,
} from 'class-validator';

export class UpdateEventDto {
  @IsEmpty({ message: 'You cannot pass user id' })
  readonly autor: User;

  @IsEnum(EventType, {
    message: 'Enter corect EventType : personal/organisation',
  })
  @IsOptional()
  type: EventType;

  @IsOptional()
  readonly ticketClasses: any;

  @IsString()
  @IsOptional()
  categoryId: string;

  @IsBoolean()
  @IsOptional()
  agreeTerms: boolean;

  @IsString()
  @IsOptional()
  dateStart: string;

  @IsString()
  @IsOptional()
  dateEnd: string;

  @IsString()
  @IsOptional()
  timeStart: string;

  @IsString()
  @IsOptional()
  timeEnd: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsBoolean()
  @IsOptional()
  paid: boolean;

  @IsString()
  @IsOptional()
  cityId: string;

  @IsString()
  @IsOptional()
  countryId: string;

  @IsString()
  @IsOptional()
  location: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  pictureUrl: string;

  @IsString()
  @IsOptional()
  coverUrl: string;

  @IsNumber()
  @IsOptional()
  phone2: number;

  @IsString()
  @IsOptional()
  whatsapp: string;

  @IsString()
  @IsOptional()
  twitter: string;

  @IsString()
  @IsOptional()
  instagram: string;

  @IsString()
  @IsOptional()
  facebook: string;

  @IsString()
  @IsOptional()
  externalLink: string;

  @IsString()
  @IsOptional()
  linkedIn: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  address: string;
}
