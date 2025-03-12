/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
import { FollowService } from 'src/follow/follow.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    private followService: FollowService,
  ) {}

  async creatUser(userData: CreateUserDto): Promise<User> {
    try {
      let datas: any = { ...userData };
      if (
        datas.email === 'flambel55@gmail.com' ||
        datas.email === 'f.sanou@yaba-in.com'
      ) {
        datas = Object.assign(datas, { verified: true });
        datas = Object.assign(datas, { vip: true });
      }
      datas = Object.assign(datas, { active: true });
      const hashedPwd = await bcrypt.hash(userData.password, 10);
      const user = await this.userModel.create({
        ...datas,
        password: hashedPwd,
      });
      user.password = '';

      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async findById(userId: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID 4');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const followers = await this.followService.getFollowersNumber(userId);
    const followings = await this.followService.getFollowingsNumber(userId);

    let userData: any = { ...user };
    userData = userData._doc;
    userData.followers = followers.length;
    userData.followings = followings.length;

    return userData;
  }

  async updateUser(userId: string, userData: UpdateUserDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user');
    }
    const user = await this.userModel.findByIdAndUpdate(userId, userData, {
      new: true,
      runValidators: true,
    });
    return user;
  }

  async updateUserPicture(
    req: any,
    files: Array<Express.Multer.File>,
  ): Promise<any> {
    // Vérifier si l'ID de l'utilisateur est valide
    console.log('fichier: ', files);
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      throw new NotFoundException('Invalid user');
    }

    // Récupérer l'utilisateur
    const user = await this.userModel.findById(req.user._id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const fileUrls = files.map((file) => {
      return `${req.protocol}://${req.get('host')}/assets/images/${file.filename}`;
    });

    const userPictureUpdate = { pictureUrl: fileUrls[0] };

    // Mettre à jour l'URL de l'image dans la base de données
    const updatedUser = await this.userModel.findByIdAndUpdate(
      req.user._id,
      userPictureUpdate,
      { new: true, runValidators: true },
    );

    console.log('User Updated: ', updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<any> {
    return await this.userModel.findByIdAndDelete(userId);
  }

  async searchByName(query: Query): Promise<User[]> {
    const resPerPage = 20;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    const keyword = query.keyword
      ? {
          $or: [
            { name: { $regex: query.keyword, $options: 'i' } },
            { firstName: { $regex: query.keyword, $options: 'i' } },
            { lastName: { $regex: query.keyword, $options: 'i' } },
          ],
        }
      : {};

    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);

    let userArray: any = [];
    for(const user of users) {
      const followers = await this.followService.getFollowersNumber(user._id);
      let userData: any = { ...user };
      userData = userData._doc;
      userData.followers = followers.length,
      userArray = [...userArray, userData]
    }

    return users;
  }

  async searchByEmail(query: Query): Promise<User[]> {
    const resPerPage = 20;
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
}
