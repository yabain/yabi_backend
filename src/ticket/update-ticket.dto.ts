import {
  IsString,
  IsEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { User } from '../user/user.schema';
import { Event, TicketClass } from '../event/event.schema';
import { EventCategories } from 'src/event-categories/event-categories.schema';

export class UpdateTicketDto {
  @IsEmpty({ message: 'You cannot pass user id' })
  readonly id: string;

  @IsOptional()
  readonly userId: User;

  @IsString()
  @IsOptional()
  readonly eventId: Event;

  @IsString()
  @IsOptional()
  readonly categoryId: EventCategories;

  @IsString()
  @IsOptional()
  readonly ticketClassId: TicketClass;

  @IsNumber()
  @IsOptional()
  readonly ticketNumber: number;

  @IsBoolean()
  @IsOptional()
  readonly active: boolean;

  @IsBoolean()
  @IsOptional()
  readonly used: boolean;
}
