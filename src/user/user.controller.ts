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

export const multerConfig = {
  storage: diskStorage({
    destination: './assets/images', // Dossier où les fichiers seront stockés
    filename: (req: any, file, callback) => {
      const userId = req.user._id; // Récupérer l'ID de l'utilisateur depuis la requête
      const fileExt = path.extname(file.originalname); // Récupérer l'extension du fichier
      const fileName = `pictureFile_${userId}${fileExt}`; // Générer le nom du fichier
      callback(null, fileName); // Retourner le nom du fichier
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 Mo
  },
};

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUser(@Query() query: ExpressQuery): Promise<User[]> {
    return this.userService.searchByEmail(query);
  }

  @Get('user-data/:id')
  async getUser(@Param('id') userId: string): Promise<any> {
    return this.userService.findById(userId);
  }

  @Post('new')
  @UsePipes(ValidationPipe) // DTO Validation
  async createUser(@Body() user: CreateUserDto): Promise<User> {
    return this.userService.creatUser(user);
  }

  @Put('update-profile')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async update(@Body() userData: UpdateUserDto, @Req() req): Promise<any> {
    console.log('user data 00000: ', userData);
    return this.userService.updateUser(req.user._id, userData);
  }

  @Put('picture')
  @UseInterceptors(FilesInterceptor('pictureFile', 1, multerConfig))
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async updatePicture(
    @Req() req,
    @UploadedFiles() picture: Array<Express.Multer.File>,
  ): Promise<any> {
    if (!picture || picture.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    console.log('fichier: ', picture);
    return this.userService.updateUserPicture(req, picture);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  async delete(@Param('id') userId: string): Promise<any> {
    return this.userService.deleteUser(userId);
  }

  @Get('research')
  async userResearch(@Query() query: ExpressQuery): Promise<any> {
    return this.userService.searchByName(query);
  }
}
