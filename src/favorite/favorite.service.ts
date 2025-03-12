/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Favorite } from './favorite.schema';
import { Event } from '../event/event.schema';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name)
    private favoriteModel: mongoose.Model<Favorite>,
    @InjectModel(Event.name)
    private eventModel: mongoose.Model<Event>,
  ) {}

  // Check if event eId extist on favorites events of user id
  async gestAllFavoritesEvent(id: any): Promise<Favorite[]> {
    let userId: any = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      userId = new mongoose.Types.ObjectId(id);
    }

    const favorites = await this.favoriteModel.find({ userId: userId }).exec();
    let res: any[] = [];
    for (const favorite of favorites) {
      const favoriteData: any = { ...favorite };
      const addData = await this.eventModel.find(favoriteData.eventId);
      res = [...res, addData];
    }

    return res;
  }

  // Check if event eId extist on favorites events of user id
  async chekIfEventIsInFavorites(eId: any, id: any): Promise<boolean> {
    let userId: any = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      userId = new mongoose.Types.ObjectId(id);
    }

    let eventId: any = eId;
    if (!mongoose.Types.ObjectId.isValid(eId)) {
      eventId = new mongoose.Types.ObjectId(eId);
    }

    const favorites = await this.favoriteModel
      .find({ eventId: eventId, userId: userId })
      .exec();
    if (favorites.length > 0) return true;
    else return false;
  }

  // Add event data data.eventId to favorite of current user data.userId
  async addToFavorites(data: any): Promise<any> {
    let userId: mongoose.Types.ObjectId;
    if (mongoose.Types.ObjectId.isValid(data.userId)) {
      userId = new mongoose.Types.ObjectId(data.userId);
    } else {
      throw new Error('userId is not a valid ObjectId');
    }

    let eventId: mongoose.Types.ObjectId;
    if (mongoose.Types.ObjectId.isValid(data.eventId)) {
      eventId = new mongoose.Types.ObjectId(data.eventId);
    } else {
      throw new Error('eventId is not a valid ObjectId');
    }

    const follow = {
      userId: userId,
      eventId: eventId,
    };

    const addData = await this.favoriteModel.create(follow);

    if (!addData) {
      throw new Error('Favorit not fond');
    }

    return true;
  }

  async removeToFavorites(data: { userId: any; eventId: any }): Promise<any> {
    let userId: mongoose.Types.ObjectId;
    if (mongoose.Types.ObjectId.isValid(data.userId)) {
      userId = new mongoose.Types.ObjectId(data.userId);
    } else {
      throw new Error('userId is not a valid ObjectId');
    }

    let eventId: mongoose.Types.ObjectId;
    if (mongoose.Types.ObjectId.isValid(data.eventId)) {
      eventId = new mongoose.Types.ObjectId(data.eventId);
    } else {
      throw new Error('eventId is not a valid ObjectId');
    }

    const filter = {
      userId: userId,
      eventId: eventId,
    };

    const favorites = await this.favoriteModel
      .find({ eventId: eventId, userId: userId })
      .exec();
    if (favorites.length > 0) {
      // Supprimer le document correspondant
      const result = await this.favoriteModel.findOneAndDelete(filter).exec();
      if (!result) {
        throw new Error('Favorit not fond');
      }
      return true;
    } else return false;
  }
}
