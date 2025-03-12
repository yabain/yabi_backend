/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventCategories } from './event-categories.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { CreateCategoryDto } from './create-category.dto';
import { Event } from '../event/event.schema';
import { Country } from '../country/country.schema';
import { City } from '../city/city.schema';
import { TicketClassesService } from '../ticket-classes/ticket-classes.service';
import { Ticket } from 'src/ticket/ticket.schema';

@Injectable()
export class EventCategoriesService {
  constructor(
    @InjectModel(EventCategories.name)
    private categoryModel: mongoose.Model<EventCategories>,
    @InjectModel(Event.name)
    private eventModel: mongoose.Model<Event>,
    @InjectModel(Country.name)
    private countryModel: mongoose.Model<Country>,
    @InjectModel(City.name)
    private cityModel: mongoose.Model<City>,
    private ticketClassesService: TicketClassesService,
  ) {}

  async findAll(query: Query): Promise<EventCategories[]> {
    const resPerPage = 200;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          name: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const countries = await this.categoryModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return countries;
  }

  async creatCategory(category: CreateCategoryDto): Promise<EventCategories> {
    try {
      const res = await this.categoryModel.create(category);
      return res;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('This name tCategories already exists');
      }
      throw error; // Propager les autres erreurs
    }
  }

  async findById(categoryId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid categoryId');
    }

    const eventCategories = await this.categoryModel.findById(categoryId);
    if (!eventCategories) {
      throw new NotFoundException('EventCategories not found');
    }

    return eventCategories;
  }

  async deleteCategory(categoryId: string): Promise<any> {
    return await this.categoryModel.findByIdAndDelete(categoryId);
  }

  async updateCategory(
    categoryId: string,
    categoryData: CreateCategoryDto,
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new NotFoundException('Invalid categoryId');
    }

    const user = await this.categoryModel.findByIdAndUpdate(
      categoryId,
      categoryData,
      {
        new: true,
        runValidators: true,
      },
    );
    return user;
  }

  async importCategories() {
    const categories = [
      {
        class: 'professional',
        cover: 'assets/imgs/pictures/cat_professional.png',
        icon: 'person-circle-outline',
        name: 'Professionnel',
        value: 'Professionnel',
        varTranslate: 'cat.pro',
      },
      {
        class: 'social',
        cover: 'assets/imgs/pictures/cat_social.png',
        icon: 'heart-half-outline',
        name: 'Social',
        value: 'Social',
        varTranslate: 'cat.social',
      },
      {
        class: 'education',
        cover: 'assets/imgs/pictures/cat_education.png',
        icon: 'book-outline',
        name: 'Education',
        value: 'Educatif',
        varTranslate: 'cat.edu',
      },
      {
        class: 'medical',
        cover: 'assets/imgs/pictures/cat_medical.png',
        icon: 'bandage-outline',
        name: 'Santé',
        value: 'Medical',
        varTranslate: 'cat.medical',
      },
      {
        class: 'sport',
        cover: 'assets/imgs/pictures/cat_sport.png',
        icon: 'football-outline',
        name: 'Sport',
        value: 'Sport',
        varTranslate: 'cat.sport',
      },
      {
        class: 'party',
        cover: 'assets/imgs/pictures/cat_party.png',
        icon: 'sparkles-outline',
        name: 'Fêtes/Diverts',
        value: 'Festif',
        varTranslate: 'cat.fest',
      },
      {
        class: 'religion',
        cover: 'assets/imgs/pictures/cat_religion.png',
        icon: 'pie-chart-outline',
        name: 'Réligieux',
        value: 'Religieux',
        varTranslate: 'cat.relig',
      },
      {
        class: 'communautaire',
        cover: 'assets/imgs/pictures/cat_communautaire.png',
        icon: 'people-circle-outline',
        name: 'Communautaire',
        value: 'Communautaire',
        varTranslate: 'cat.com',
      },
      {
        class: 'caritative',
        cover: 'assets/imgs/pictures/cat_caritative.png',
        icon: 'hand-left-outline',
        name: 'Caritatif',
        value: 'Caritatif',
        varTranslate: 'cat.carit',
      },
      {
        class: 'cultural',
        cover: 'assets/imgs/pictures/cat_cultural.png',
        icon: 'help-buoy-outline',
        name: 'Culturel',
        value: 'Culturel',
        varTranslate: 'cat.culture',
      },
      // {
      //   class: 'fundrasing',
      //   cover: 'assets/imgs/pictures/cat_collecte.png',
      //   icon: 'help-buoy-outline',
      //   name: 'Collecte de fonds',
      //   value: 'Collecte de fonds',
      //   varTranslate: 'cat.fund',
      // },
    ];
    for (const category of categories) {
      try {
        await this.creatCategory(category);
      } catch (error) {
        console.log('Catégorie existante : ', category.name);
      }
    }
  }

  async getUpcommingEventsOfCategory(categoryId: string, query: Query) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new Error('Invalid category ID');
    }
    const category = new mongoose.Types.ObjectId(categoryId);

    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    if (isNaN(currentPage)) {
      throw new Error('Invalid page number');
    }
    const skip = resPerPage * (currentPage - 1);

    const keyword =
      typeof query.keyword === 'string' && query.keyword.trim() !== ''
        ? {
            title: {
              $regex: query.keyword.trim(),
              $options: 'i',
            },
          }
        : {};

    const currentDate = new Date();
    let eventList: any;
    if (query.cityId) {
      eventList = await this.eventModel
        .find({
          ...keyword,
          categoryId: category,
          cityId: query.cityId,
          dateEnd: { $gte: currentDate },
        })
        .limit(resPerPage)
        .skip(skip);
    } else {
      eventList = await this.eventModel
        .find({
          ...keyword,
          categoryId: category,
          dateEnd: { $gte: currentDate },
        })
        .limit(resPerPage)
        .skip(skip);
    }

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
