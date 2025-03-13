/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '@nestjs/passport';
import { Query as ExpressQuery } from 'express-serve-static-core';
// import { CreateFavoriteDto } from './create-favorite.dto';

@Controller('favorite')
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Get('get-favorites-event/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async gestAllFavoritesEventOfUser(
    @Param('id') eventId: string,
    @Req() req,
    @Query() query: ExpressQuery,
  ): Promise<any> {
    return this.favoriteService.gestAllFavoritesEventOfUser(
      req.user._id,
      query,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async chekIfEventIsInFavorites(
    @Param('id') evenId: string,
    @Req() req,
  ): Promise<any> {
    return this.favoriteService.chekIfEventIsInFavorites(evenId, req.user._id);
  }

  @Post('add')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async addToFavorites(@Body() favorite: any, @Req() req): Promise<any> {
    const favoriteData = {
      ...favorite,
      userId: req.user._id,
    };
    return this.favoriteService.addToFavorites(favoriteData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async removeToFavorites(
    @Param('id') eventId: string,
    @Req() req,
  ): Promise<any> {
    const favoriteData = {
      eventId: eventId,
      userId: req.user._id,
    };
    return this.favoriteService.removeToFavorites(favoriteData);
  }
}
