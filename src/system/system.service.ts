import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { System } from './system.schema';
import * as mongoose from 'mongoose';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(System.name)
    private systemModel: mongoose.Model<System>,
  ) {}

  async getData(): Promise<any> {
    return await this.systemModel.find();
  }
}
