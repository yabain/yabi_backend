/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

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
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/user.schema';

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
    private emailService: EmailService,
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
    console.log("ticket data: ", tickets);
    return tickets;
  }

  async createFreeTicket(
    ticket: CreateTicketDto,
    user: User,
    sendMail?: boolean,
  ): Promise<any> {
    const ticketClassData: any = await this.ticketClassesModel
      .findById(ticket.ticketClassId)
      .populate('eventId');
    if (!ticketClassData) {
      throw new NotFoundException('Ticket class not found');
    }

    if (!this.isPastDateTime(ticketClassData.eventId.dateEnd)) {
      throw new NotFoundException('Event ended');
    }
    // if (
    //   ticketClassData.quantity > 0 &&
    //   ticketClassData.quantity <= ticketClassData.taken
    // ) {
    //   throw new BadRequestException('No available tickets');
    // }

    if (typeof ticket.ticketClassId !== 'string') {
      throw new BadRequestException('Invalid ticketClass ID');
    }

    const updatedTicketClass = await this.incrementTaken(ticket.ticketClassId);

    const ticketData = {
      ...ticket,
      ticketNumber: updatedTicketClass.taken,
      userId: user._id,
      used: false,
      active: true,
    };

    const createdTicket = await this.ticketModel.create(ticketData);

    try {
      const eventData = await this.eventModel
        .findById(ticket.eventId)
        .populate('cityId')
        .populate('countryId')
        .populate('categoryId')
        .exec();

      if (eventData && user.email && sendMail) {
        await this.senMail(eventData, user);
      }
    } catch (error) {
      console.error('Failed to send participation email:', error);
    }

    return createdTicket;
  }

  async senMail(eventData: any, user: any, price?: number): Promise<any> {
    return await this.emailService.sendEventParticipationEmail(
      user.email,
      user.language || 'en', // Default value if language not defined
      user.name || `${user.firstName} ${user.lastName}`,
      {
        price: price ? `${price} FCFA` : 0,
        eventData: {
          _id: eventData._id,
          title: eventData.title,
          description: eventData.description,
          cover: eventData.cover,
          dateStart: eventData.dateStart,
          dateEnd: eventData.dateEnd,
          location: eventData.location,
          paid: eventData.paid,
        },
        categoryData: eventData.categoryId
          ? {
              name: eventData.categoryId.name,
            }
          : null,
        countryData: eventData.countryId
          ? {
              name: eventData.countryId.name,
            }
          : null,
        cityData: eventData.cityId
          ? {
              name: eventData.cityId.name,
            }
          : null,
      },
    );
  }

  async createMultipleTicket(transactionData: any, userData): Promise<boolean> {
    const ticketArray: any[] = transactionData.tickets;
    for (const ticket of ticketArray) {
      const ticketData: CreateTicketDto = {
        eventId: transactionData.eventId,
        categoryId: transactionData.categoryId,
        ticketClassId: ticket.ticketClassId,
        userId: userData._id,
      };
      const quantity: number = ticket.quantity;
      for (let i = 0; i < quantity; i++) {
        await this.createFreeTicket(ticketData, userData, false);
      }
    }
    const event = await this.eventModel.findById(transactionData.eventId);
    this.senMail(event, userData, transactionData.paymentWithTaxes);
    return true;
  }

  isPastDateTime(dateStr: string): boolean {
    const targetDateTime = new Date(`${dateStr}`);
    const currentDateTime = new Date();
    return targetDateTime > currentDateTime;
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
      .populate('ticketClassId')
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
