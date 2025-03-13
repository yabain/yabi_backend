/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';
import { CreateUserDto } from './create-user.dto';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateUserDto } from './update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

// Configuration for Multer to handle file uploads
export const multerConfig = {
  storage: diskStorage({
    destination: './assets/images', // Directory where files will be stored
    filename: (req: any, file, callback) => {
      const userId = req.user._id; // Get user ID from the request
      const fileExt = path.extname(file.originalname); // Get file extension
      const fileName = `pictureFile_${userId}${fileExt}`; // Generate file name
      callback(null, fileName); // Return the file name
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5 MB
  },
};

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get all users with optional query parameters for filtering and pagination.
   * @param query - Query parameters for filtering and pagination.
   * @returns A list of users.
   */
  @Get()
  async getAllUser(@Query() query: ExpressQuery): Promise<User[]> {
    return this.userService.searchByEmail(query);
  }

  /**
   * Get user data by ID.
   * @param userId - The ID of the user to retrieve.
   * @returns The user data.
   */
  @Get('user-data/:id')
  async getUser(@Param('id') userId: string): Promise<any> {
    return this.userService.findById(userId);
  }

  /**
   * Create a new user.
   * @param user - The user data to create.
   * @returns The created user.
   */
  @Post('new')
  @UsePipes(ValidationPipe) // Validate the incoming data using the CreateUserDto
  async createUser(@Body() user: CreateUserDto): Promise<User> {
    return this.userService.creatUser(user);
  }

  /**
   * Update the profile of the authenticated user.
   * @param userData - The updated user data.
   * @param req - The request object containing the authenticated user.
   * @returns The updated user data.
   */
  @Put('update-profile')
  @UseGuards(AuthGuard()) // Protect the route with authentication
  @UsePipes(ValidationPipe) // Validate the incoming data using the UpdateUserDto
  async update(@Body() userData: UpdateUserDto, @Req() req): Promise<any> {
    return this.userService.updateUser(req.user._id, userData);
  }

  /**
   * Update the profile picture of the authenticated user.
   * @param req - The request object containing the authenticated user.
   * @param picture - The uploaded picture file.
   * @returns The updated user data.
   * @throws BadRequestException if no file is uploaded.
   */
  @Put('picture')
  @UseInterceptors(FilesInterceptor('pictureFile', 1, multerConfig)) // Handle file uploads
  @UseGuards(AuthGuard()) // Protect the route with authentication
  @UsePipes(ValidationPipe) // Validate the incoming data
  async updatePicture(
    @Req() req,
    @UploadedFiles() picture: Array<Express.Multer.File>,
  ): Promise<any> {
    if (!picture || picture.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    console.log('file: ', picture);
    return this.userService.updateUserPicture(req, picture);
  }

  /**
   * Delete a user by ID.
   * @param userId - The ID of the user to delete.
   * @returns The result of the deletion operation.
   */
  @Delete(':id')
  @UseGuards(AuthGuard()) // Protect the route with authentication
  async delete(@Param('id') userId: string): Promise<any> {
    return this.userService.deleteUser(userId);
  }

  /**
   * Search for users by name with optional query parameters for filtering and pagination.
   * @param query - Query parameters for filtering and pagination.
   * @returns A list of users matching the search criteria.
   */
  @Get('research')
  async userResearch(@Query() query: ExpressQuery): Promise<any> {
    return this.userService.searchByName(query);
  }
}
