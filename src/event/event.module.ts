import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { EventSchema } from './event.schema';
import { UserSchema } from '../user/user.schema';
import { CountrySchema } from '../country/country.schema';
import { CitySchema } from '../city/city.schema';
import { TicketClassesSchema } from '../ticket-classes/ticket-classes.shema';
import { TicketClassesService } from '../ticket-classes/ticket-classes.service';
import { EventCategoriesSchema } from '../event-categories/event-categories.schema';
import { TicketService } from 'src/ticket/ticket.service';
import { TicketSchema } from 'src/ticket/ticket.schema';
import { Follow, FollowSchema } from 'src/follow/follow.schema';
import { UserService } from 'src/user/user.service';
import { FollowService } from 'src/follow/follow.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'EventCategories', schema: EventCategoriesSchema },
    ]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Country', schema: CountrySchema }]),
    MongooseModule.forFeature([{ name: 'City', schema: CitySchema }]),
    MongooseModule.forFeature([{ name: 'Ticket', schema: TicketSchema }]),
    MongooseModule.forFeature([
      { name: 'TicketClasses', schema: TicketClassesSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
  ],
  controllers: [EventController],
  providers: [
    EventService,
    TicketClassesService,
    TicketService,
    UserService,
    FollowService,
  ],
  exports: [EventService],
})
export class EventModule {}
