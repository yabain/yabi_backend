/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { City } from './city.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { CreateCityDto } from './create-city.dto';

@Injectable()
export class CityService {
  constructor(
    @InjectModel(City.name)
    private cityModel: mongoose.Model<City>,
  ) {}

  async findAll(query: Query): Promise<City[]> {
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
    const countries = await this.cityModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return countries;
  }

  async creatCity(city: CreateCityDto): Promise<City> {
    try {
      console.log('Creating city with data:', city); // Log les données reçues
      const res = await this.cityModel.create(city);
      console.log('City created successfully:', res); // Log le résultat de la création
      return res;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('This name city already exists');
      }
      throw error; // Propager les autres erreurs
    }
  }

  async findById(cityId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      throw new NotFoundException('Invalid city ID');
    }

    const city = await this.cityModel.findById(cityId);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    return city;
  }

  async deleteCity(cityId: string): Promise<any> {
    return await this.cityModel.findByIdAndDelete(cityId);
  }

  async updateCity(cityId: string, cityData: CreateCityDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      throw new NotFoundException('Invalid cityId');
    }

    const user = await this.cityModel.findByIdAndUpdate(cityId, cityData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  async importCities() {
    const cities = [
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Bafang',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Bafia',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Bafoussam',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Bamenda',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Bangangté',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Buéa',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Douala',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Dschang',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Ebolowa',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Foumban',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Garoua',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Kaélé',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Koussérie',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Kribi',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Mbalmayo',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Mbanga',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Nagoundéré',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Sangmélima',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Yagoua',
      },
      {
        countryId: '67be767a2c45980b6a5b79f1',
        name: 'Yaoundé',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Bandundu',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Baraka',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Beni',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Boende',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Boma',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Bukavu',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Bunia',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Buta',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Butembo',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Gbadolite',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Gemena',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Goma',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Inongo',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Isiro',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kabinda',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kalemie',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kamina',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kananga',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kenge',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kikwit',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kindu',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kisangani',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kinshasa',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Kolwezi',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Likasi',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Lisala',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Lubumbashi',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Lusambo',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Matadi',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Mbandaka',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Mbujimayi',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Muene-Ditu',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Tshikapa',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Uvira',
      },
      {
        countryId: '67be769a2c45980b6a5b79f5',
        name: 'Zongo',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Libreville',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Moanda',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Bitam',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Booué',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Cocobeach',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Fougamou',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Franceville',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Gamba',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Kango',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Koulamoutou',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Lambaréné',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Lastourville',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Lékoni',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Libreville',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Makokou',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mayumba',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mbigou',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Medouneu',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mékambo',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mitzic',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mimongo',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Minvoul',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mounana',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Moanda',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Mouila',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Ndendé',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Ndjolé',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Nkan',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Ntoum',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Okondja',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Omboué',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Oyem',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Port-Gentil',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Tchibanga',
      },
      {
        countryId: '67be768e2c45980b6a5b79f3',
        name: 'Tsogni',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Bata',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Malabo',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Ebebiyín',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Aconibe',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Añisoc',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Luba',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Evinayong',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Mongomo',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Mengomeyén',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Mikomeseng',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Rebola',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Bidjabidjan',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Niefang',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Cogo',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Nsok',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'SAP',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Mbini',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Nsork',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Ayene',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Nkimi',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Machinda',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Acurenam',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Corisco',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Baney',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Bicurga',
      },
      {
        countryId: '67c0bda30ac91515f85408c4',
        name: 'Nsang',
      },
    ];
    for (const city of cities) {
      try {
        await this.creatCity(city);
        console.log('importation de : ', city.name);
      } catch (error) {
        console.log('Ville existante : ', city.name);
      }
    }
  }
}
