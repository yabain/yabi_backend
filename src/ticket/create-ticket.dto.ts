import { IsString, IsNotEmpty, IsEmpty } from 'class-validator';
import { EventCategories } from '../event-categories/event-categories.schema';
import { User } from '../user/user.schema';
import { TicketClasses } from 'src/ticket-classes/ticket-classes.shema';

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
  readonly ticketClassId: TicketClasses;
}
