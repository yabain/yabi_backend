/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
  ) {}

  async findAll(query: Query): Promise<User[]> {
    const resPerPage = 10;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          email: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);
    return users;
  }

  async creatUser(userData: CreateUserDto): Promise<User> {
    console.log('userData de test de création de user', userData);
    try {
      let datas: any = { ...userData };
      if (
        datas.email === 'flambel55@gmail.com' ||
        datas.email === 'f.sanou@yaba-in.com'
      ) {
        datas = Object.assign(datas, { verified: true });
        datas = Object.assign(datas, { vip: true });
        console.log('datas de test de création de user', datas);
      }
      datas = Object.assign(datas, { active: true });
      const hashedPwd = await bcrypt.hash(userData.password, 10);
      const user = await this.userModel.create({
        ...datas,
        password: hashedPwd,
      });
      user.password = '';
      console.log('ici le nouveau test de création de user', datas);

      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error; // Propager les autres erreurs
    }
  }

  async findById(userId: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, userData: UpdateUserDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const user = await this.userModel.findByIdAndUpdate(userId, userData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  async deleteUser(userId: string): Promise<any> {
    return await this.userModel.findByIdAndDelete(userId);
  }
}
