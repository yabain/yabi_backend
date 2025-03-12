import {
  IsString,
  IsNotEmpty,
  IsEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { EventCategories } from '../event-categories/event-categories.schema';
import { User } from '../user/user.schema';
import { TicketClass } from '../event/event.schema';

export class CreateTicketDto {
  @IsEmpty({ message: 'You cannot pass user id' })
  readonly id: string;

  @IsEmpty({ message: 'You cannot pass user id' })
  readonly userId: User;

  @IsString()
  @IsNotEmpty()
  readonly eventId: Event;

  @IsString()
  @IsNotEmpty()
  readonly categoryId: EventCategories;

  @IsString()
  @IsNotEmpty()
  readonly ticketClassId: TicketClass;
}
