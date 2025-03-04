import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.schema';
import { CreateUserDto } from './create-user.dto';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateUserDto } from './update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUser(@Query() query: ExpressQuery): Promise<User[]> {
    console.log('Getting all users');
    return this.userService.findAll(query);
  }

  @Get(':id')
  async getUser(@Param('id') userId: string): Promise<any> {
    console.log('Getting one user');
    return this.userService.findById(userId);
  }

  @Post('new')
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `CreateUserDto`
  async createUser(@Body() user: CreateUserDto): Promise<User> {
    console.log('User creation');
    return this.userService.creatUser(user);
  }

  @Put(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `UpdateUserDto`
  async update(
    @Param('id') userId: string,
    @Body() user: UpdateUserDto,
  ): Promise<any> {
    console.log('Update one user');
    return this.userService.updateUser(userId, user);
  }

  @Delete(':id')
  // @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  async delete(@Param('id') userId: string): Promise<any> {
    console.log('Update one user');
    return this.userService.deleteUser(userId);
  }
}
