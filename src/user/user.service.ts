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

  /**
   * Create a new user.
   * @param userData - The user data to create.
   * @returns The created user.
   * @throws ConflictException if the email already exists.
   */
  async creatUser(userData: CreateUserDto): Promise<User> {
    try {
      let datas: any = { ...userData };
      // Grant VIP and verified status to specific emails
      if (
        datas.email === 'flambel55@gmail.com' ||
        datas.email === 'f.sanou@yaba-in.com'
      ) {
        datas = Object.assign(datas, { verified: true });
        datas = Object.assign(datas, { vip: true });
      }
      datas = Object.assign(datas, { active: true });

      // Hash the user's password
      const hashedPwd = await bcrypt.hash(userData.password, 10);

      // Create the user in the database
      const user = await this.userModel.create({
        ...datas,
        password: hashedPwd,
      });

      // Remove the password from the returned user object for security
      user.password = '';

      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  /**
   * Find a user by ID and enrich the data with follower and following counts.
   * @param userId - The ID of the user to retrieve.
   * @returns The user data with follower and following counts.
   * @throws NotFoundException if the user ID is invalid or the user is not found.
   */
  async findById(userId: any): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    // Find the user by ID
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    } else user.password = '';

    // Get the number of followers and followings
    const followers = await this.followService.getFollowersNumber(userId);
    const followings = await this.followService.getFollowingsNumber(userId);

    // Enrich user data with follower and following counts
    let userData: any = { ...user };
    userData = userData._doc;
    userData.followers = followers.length;
    userData.followings = followings.length;

    return userData;
  }

  /**
   * Update a user by ID.
   * @param userId - The ID of the user to update.
   * @param userData - The updated user data.
   * @returns The updated user.
   * @throws NotFoundException if the user ID is invalid.
   */
  async updateUser(userId: string, userData: UpdateUserDto): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user');
    }

    // Update the user in the database
    const user = await this.userModel.findByIdAndUpdate(userId, userData, {
      new: true,
      runValidators: true,
    })
    .populate('countryId')
    .populate('cityId');

    if (!user) {
      throw new NotFoundException('User not found');
    } else user.password = '';

    return user;
  }

  /**
   * Update the profile picture of a user.
   * @param req - The request object containing the authenticated user.
   * @param files - The uploaded files (e.g., profile picture).
   * @returns The updated user data.
   * @throws NotFoundException if the user ID is invalid or the user is not found.
   */
  async updateUserPicture(
    req: any,
    files: Array<Express.Multer.File>,
  ): Promise<any> {
    // Check if the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
      throw new NotFoundException('Invalid user');
    }

    // Find the user by ID
    const user = await this.userModel.findById(req.user._id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else user.password = '';

    // Generate URLs for the uploaded files
    const fileUrls = files.map((file) => {
      return `${req.protocol}://${req.get('host')}/assets/images/${file.filename}`;
    });

    // Prepare the update data with the new profile picture URL
    const userPictureUpdate = { pictureUrl: fileUrls[0] };

    // Update the user's profile picture in the database
    const updatedUser = await this.userModel.findByIdAndUpdate(
      req.user._id,
      userPictureUpdate,
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    } else updatedUser.password = '';

    return updatedUser;
  }

  /**
   * Delete a user by ID.
   * @param userId - The ID of the user to delete.
   * @returns The result of the deletion operation.
   */
  async deleteUser(userId: string): Promise<any> {
    return await this.userModel.findByIdAndDelete(userId);
  }

  /**
   * Search for users by name with optional keyword and pagination.
   * @param query - Query parameters for keyword search and pagination.
   * @returns A list of users matching the search criteria.
   */
  async searchByName(query: Query): Promise<User[]> {
    const resPerPage = 20;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    // Define the keyword search criteria
    const keyword = query.keyword
      ? {
          $or: [
            { name: { $regex: query.keyword, $options: 'i' } },
            { firstName: { $regex: query.keyword, $options: 'i' } },
            { lastName: { $regex: query.keyword, $options: 'i' } },
          ],
        }
      : {};

    // Find users matching the keyword with pagination
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);

    // Enrich user data with follower counts
    let userArray: any = [];
    for (const user of users) {
      user.password = '';
      const followers = await this.followService.getFollowersNumber(user._id);
      let userData: any = { ...user };
      userData = userData._doc;
      userData.followers = followers.length;
      userArray = [...userArray, userData];
    }

    return users;
  }

  /**
   * Search for users by email with optional keyword and pagination.
   * @param query - Query parameters for keyword search and pagination.
   * @returns A list of users matching the search criteria.
   */
  async searchByEmail(query: Query): Promise<User[]> {
    const resPerPage = 20;
    const currentPage = Number(query.page) || 1;
    const skip = resPerPage * (currentPage - 1);

    // Define the keyword search criteria
    const keyword = query.keyword
      ? {
          email: {
            $regex: query.keyword,
            $options: 'i',
          },
        }
      : {};

    // Find users matching the keyword with pagination
    const users = await this.userModel
      .find({ ...keyword })
      .limit(resPerPage)
      .skip(skip);

    return users;
  }
}
