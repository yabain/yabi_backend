/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket } from './ticket.schema';
import { CreateTicketDto } from './create-ticket.dto';
import { TicketClasses } from '../ticket-classes/ticket-classes.shema';
import { Event } from '../event/event.schema';
import { Country } from 'src/country/country.schema';
import { City } from 'src/city/city.schema';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name)
    private ticketModel: mongoose.Model<Ticket>,
    @InjectModel(TicketClasses.name)
    private ticketClassesModel: mongoose.Model<TicketClasses>,
    @InjectModel(Event.name)
    private eventModel: mongoose.Model<Event>,
    @InjectModel(Country.name)
    private countryModel: mongoose.Model<Country>,
    @InjectModel(City.name)
    private cityModel: mongoose.Model<City>,
  ) {}

  async getAllTicketsOfEvent(id: string): Promise<Ticket[]> {
    let eventId: any = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      eventId = new mongoose.Types.ObjectId(id);
    }

    const tickets = await this.ticketModel.find({ eventId: eventId }).exec();
    if (!tickets) {
      throw new NotFoundException('tickets not found');
    }

    return tickets;
  }

  // Get all tickets of a user (by userId)
  async getAllMyTickets(id: string): Promise<Ticket[]> {
    let userId: any = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      userId = new mongoose.Types.ObjectId(id);
    }

    const tickets = await this.ticketModel
      .find({ userId: userId })
      .populate('eventId')
      .populate('categoryId')
      .exec();
    if (!tickets) {
      throw new NotFoundException('tickets not found');
    }
    return tickets;
  }

  async createFreeTicket(ticket: CreateTicketDto, userId: any): Promise<any> {
    const ticketClassData = await this.ticketClassesModel.findById(
      ticket.ticketClassId,
    );
    if (!ticketClassData) {
      throw new NotFoundException('Ticket class not found');
    }

    if (
      ticketClassData.quantity != 0 &&
      ticketClassData.quantity <= ticketClassData.taken
    ) {
      throw new BadRequestException('No available tickets');
    }

    if (typeof ticket.ticketClassId !== 'string') {
      throw new Error('Invalid ticket class ID');
    }

    const updatedTicketClass = await this.incrementTaken(ticket.ticketClassId);

    const ticketData = {
      ...ticket,
      ticketNumber: updatedTicketClass.taken, // Utiliser le nouveau nombre de tickets pris
      userId: userId,
      used: false,
      active: true,
    };

    const createdTicket = await this.ticketModel.create(ticketData);
    return createdTicket;
  }

  async incrementTaken(ticketClassId: string): Promise<any> {
    return this.ticketClassesModel
      .findByIdAndUpdate(
        ticketClassId,
        { $inc: { taken: 1 } }, // Incrémenter taken de 1
        { new: true }, // Retourner le document mis à jour
      )
      .exec();
  }

  // Check if event eId extist on participate events of user id
  async checkParticipantsStatus(eId: any, id: any): Promise<boolean> {
    let eventId: any = eId;
    if (!mongoose.Types.ObjectId.isValid(eId)) {
      eventId = new mongoose.Types.ObjectId(eId);
    }

    const participants = await this.ticketModel
      .find({ eventId: eventId, userId: id })
      .exec();
    if (participants.length > 0) return true;
    else return false;
  }

  async getTicketData(id): Promise<any> {
    let ticketId: any = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      ticketId = new mongoose.Types.ObjectId(id);
    }

    const ticketData = await this.ticketModel
      .findById(ticketId)
      .populate('eventId')
      .populate('userId')
      .exec();
    if (!ticketData) {
      throw new NotFoundException('ticket not found');
    }

    let ticketData2: any = { ...ticketData };
    ticketData2 = ticketData2._doc;

    // Vérifier que eventData n'est pas null avant d'accéder à ses propriétés
    const countryData: any = await this.countryModel.findById(
      ticketData2.eventId.countryId,
    );
    if (!countryData) {
      throw new NotFoundException('country not found');
    }

    const cityData = await this.cityModel.findById(ticketData2.eventId.cityId);
    if (!cityData) {
      throw new NotFoundException('city not found');
    }

    const ticket: any = {
      ...ticketData2,
      countryData: countryData,
      cityData: cityData,
    };
    return ticket;
  }
}
