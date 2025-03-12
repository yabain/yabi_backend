/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Event } from './event.schema';
import { Country } from '../country/country.schema';
import { City } from '../city/city.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { CreateEventDto } from './create-event.dto';
import { UpdateEventDto } from './update-event.dto';
import { TicketClassesService } from '../ticket-classes/ticket-classes.service';
import { EventCategories } from '../event-categories/event-categories.schema';
import { TicketService } from '../ticket/ticket.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: mongoose.Model<Event>,
    @InjectModel(Country.name)
    private countryModel: mongoose.Model<Country>,
    @InjectModel(City.name)
    private cityModel: mongoose.Model<City>,
    @InjectModel(EventCategories.name)
    private eventCategoryModel: mongoose.Model<EventCategories>,
    private userService: UserService,
    private ticketClassesService: TicketClassesService,
    private TicketService: TicketService,
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
      .find({ ...keyword, type: 'public' })
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

    const fileUrls = files.map((file) => {
      return `${req.protocol}://${req.get('host')}/assets/images/${file.filename}`;
    });

    const eventData = {
      ...event,
      autor: userId,
      cover: fileUrls[0],
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
      throw new NotFoundException('Invalid user ID 0');
    }

    const event: any = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const userData: any = await this.userService.findById(event.autor);
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

    const categoryData = await this.eventCategoryModel.findById(
      event.categoryId,
    );
    if (!categoryData) {
      throw new NotFoundException('categoryData not found');
    }

    const ticketClasses =
      await this.ticketClassesService.findByEventId(eventId);
    if (!ticketClasses) {
      throw new NotFoundException('ticketClasses not found');
    }

    console.log('eventData: ', event);
    const eventData: any = { ...event._doc };
    userData.password = '';
    eventData.autorData = userData;
    eventData.countryData = countryData;
    eventData.cityData = cityData;
    eventData.ticketClasses = ticketClasses;
    eventData.category = categoryData;

    return eventData;
  }

  async updateEvent(eventId: string, eventData: UpdateEventDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundException('Invalid event ID');
    }

    const event = await this.eventModel.findByIdAndUpdate(eventId, eventData, {
      new: true,
      runValidators: true,
    });

    return event;
  }

  async deleteEvent(eventId: string): Promise<any> {
    return await this.eventModel.findByIdAndDelete(eventId);
  }

  async getParticipantsList(eventId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundException('Invalid user ID 1');
    }

    const ticketsList: any =
      await this.TicketService.getAllTicketsOfEvent(eventId);
    if (!ticketsList) {
      throw new NotFoundException('Event not found');
    }

    const uniqueData = Object.values(
      ticketsList.reduce((acc, obj) => {
        if (!acc[obj.userId]) {
          acc[obj.userId] = obj;
        }
        return acc;
      }, {}),
    );

    let participants: any[] = [];
    for (const ticket of uniqueData as any[]) {
      const userId = new mongoose.Types.ObjectId(ticket.userId);
      const user = await this.userService.findById(userId); // Ajouter await
      participants = [...participants, user];
    }

    console.log('Liste des participants: ', participants);
    return participants;
  }

  // find event by id withoud all another data (ex to use: metatags)
  async findEventById(eventId: string): Promise<Event | null> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new NotFoundException('Invalid user ID 2');
    }
    return this.eventModel.findById(eventId).exec();
  }

  async getProgressivePublicEventsOfUser(
    userId: any,
    query: Query,
  ): Promise<Event[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const events = await this.eventModel
      .find({ autor: userId, type: 'public' })
      .limit(resPerPage)
      .skip(skip);
    return events;
  }

  async getProgressiveAllEventsOfUser(
    userId: any,
    query: Query,
  ): Promise<Event[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const eventList = await this.eventModel
      .find({ autor: userId })
      .limit(resPerPage)
      .skip(skip);

    if (eventList.length > 0) {
      let events: any = [];
      for (const eventItem of eventList) {
        const countryData: any = await this.countryModel.findById(
          eventItem.countryId,
        );
        if (!countryData) {
          throw new NotFoundException('country not found');
        }

        const cityData = await this.cityModel.findById(eventItem.cityId);
        if (!cityData) {
          throw new NotFoundException('city not found');
        }

        const ticketClasses = await this.ticketClassesService.findByEventId(
          eventItem._id,
        );
        if (!ticketClasses) {
          throw new NotFoundException('ticketClasses not found');
        }

        let eventData: any = { ...eventItem };
        eventData = eventData._doc;
        eventData.countryData = countryData;
        eventData.cityData = cityData;
        eventData.ticketClasses = ticketClasses;

        events = [...events, eventData];
      }

      return events;
    } else return eventList;
  }
}
