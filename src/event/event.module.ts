import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { EventSchema } from './event.schema';
import { UserSchema } from '../user/user.schema';
import { CountrySchema } from '../country/country.schema';
import { CitySchema } from '../city/city.schema';
import { TicketClassesSchema } from 'src/ticket-classes/ticket-classes.shema';
import { TicketClassesService } from 'src/ticket-classes/ticket-classes.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Country', schema: CountrySchema }]),
    MongooseModule.forFeature([{ name: 'City', schema: CitySchema }]),
    MongooseModule.forFeature([
      { name: 'TicketClasses', schema: TicketClassesSchema },
    ]),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }]),
  ],
  controllers: [EventController],
  providers: [EventService, TicketClassesService],
})
export class EventModule {}
