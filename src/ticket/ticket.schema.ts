import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { EventCategories } from 'src/event-categories/event-categories.schema';
import { TicketClass } from 'src/event/event.schema';
import { User } from 'src/user/user.schema';
import { Event } from 'src/event/event.schema';

@Schema({
  timestamps: true,
})
export class Ticket extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event' })
  eventId: Event;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EventCategories' })
  categoryId: EventCategories;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'TicketClass' })
  ticketClassId: TicketClass;

  @Prop()
  ticketNumber: number;

  @Prop()
  active: boolean;

  @Prop()
  used: boolean;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
