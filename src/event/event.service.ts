/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './event.schema';
import { User } from '../user/user.schema';
import { Country } from '../country/country.schema';
import { City } from '../city/city.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { CreateEventDto } from './create-event.dto';
import { UpdateEventDto } from './update-event.dto';
import { TicketClassesService } from 'src/ticket-classes/ticket-classes.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: mongoose.Model<Event>,
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    @InjectModel(Country.name)
    private countryModel: mongoose.Model<Country>,
    @InjectModel(City.name)
    private cityModel: mongoose.Model<City>,
    private ticketClassesService: TicketClassesService,
  ) {}

  async findAll(query: Query): Promise<Event[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          title: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const events = await this.eventModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return events;
  }

  async creatEvent(
    event: CreateEventDto,
    req: any,
    files: Array<Express.Multer.File>,
  ): Promise<Event> {
    const userId = req.user._id;

    // Générer les URLs des fichiers uploadés
    const fileUrls = files.map((file) => {
      return `${req.protocol}://${req.get('host')}/assets/images/${file.filename}`;
    });

    // Créer l'événement avec les URLs des fichiers
    const eventData = {
      ...event,
      autor: userId,
      cover: fileUrls[0], // Enregistrer les URLs des fichiers
    };
    const res = await this.eventModel.create(eventData);
    await this.ticketClassesService.creatTicketClass(
      event.ticketClasses,
      res._id,
    );
    return res;
  }

  async findById(eventId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const event: any = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    let userData: any = await this.userModel.findById(event.autor);
    if (!userData) {
      throw new NotFoundException('Autor not found');
    }

    const countryData: any = await this.countryModel.findById(event.countryId);
    if (!countryData) {
      throw new NotFoundException('country not found');
    }

    const cityData = await this.cityModel.findById(event.cityId);
    if (!cityData) {
      throw new NotFoundException('city not found');
    }

    const eventData: any = { ...event._doc };
    userData = { ...userData._doc };
    userData.password = '';
    eventData.autorData = userData;
    eventData.countryData = countryData;
    eventData.cityData = cityData;

    return eventData;
  }

  async updateEvent(eventId: string, eventData: UpdateEventDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundException('Invalid event ID');
    }

    const user = await this.eventModel.findByIdAndUpdate(eventId, eventData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  async deleteEvent(eventId: string): Promise<any> {
    return await this.eventModel.findByIdAndDelete(eventId);
  }

  // async updateTakenSeat(eventId: string, passClassArray: any[]): Promise<any> {
  //   const event = await this.eventModel.findById(eventId).exec();

  //   if (!event) {
  //     throw new Error('Event not found');
  //   }

  //   for (const passClass of passClassArray) {
  //     const ticketClasses = event.ticketClasses.find(
  //       (ticket) => ticket.name === passClass.name,
  //     );

  //     if (!ticketClasses) {
  //       throw new Error('VIP ticket not found');
  //     }
  //     ticketClasses.taken =
  //       ticketClasses.taken + Number(passClass.numberOfTicket);

  //     return event.save();
  //   }
  // }
}
