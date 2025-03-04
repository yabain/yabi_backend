/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { TicketClasses } from '../ticket-classes/ticket-classes.shema';
// import { CreateTicketClassesDto } from './create-ticket-classes.dto';

@Injectable()
export class TicketClassesService {
  constructor(
    @InjectModel(TicketClasses.name)
    private ticketClassesModel: mongoose.Model<TicketClasses>,
  ) {}

  async creatTicketClass(ticketClasses: any, eventId: any): Promise<any> {
    ticketClasses = JSON.parse(ticketClasses);
    console.log('ticketClasses -----5--: ', ticketClasses);
    let res: any[] = [];
    for (const ticketClass of ticketClasses) {
      const classData: any = { ...ticketClass, eventId: eventId };
      const addData = await this.ticketClassesModel.create(classData);
      res = [...res, addData];
    }
    console.log('le tableau des Classes: ', res);
    return res;
  }
}
