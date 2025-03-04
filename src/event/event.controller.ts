/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
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
import { EventService } from './event.service';
import { Event } from './event.schema';
import { CreateEventDto } from './create-event.dto';
import { Query as ExpressQuery } from 'express-serve-static-core';
import { UpdateEventDto } from './update-event.dto';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '..//multer.config';
@Controller('event')
export class EventController {
  constructor(private eventService: EventService) {}

  @Get()
  async getAllEvents(@Query() query: ExpressQuery): Promise<Event[]> {
    console.log('Getting all event');
    return this.eventService.findAll(query);
  }

  @Get(':id')
  async getEvent(@Param('id') eventId: string): Promise<any> {
    console.log('Getting one event');
    return this.eventService.findById(eventId);
  }

  @Post('new')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig)) // 'files' est le nom du champ dans le formulaire, 10 est le nombre maximum de fichiers
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour vérifier l'authentification
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `CreateEventDto`
  async createEvent(
    @Body() event: any,
    @Req() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    const eventData = {
      ...req.body,
      dateStart: new Date(req.body.dateStart),
      dateEnd: new Date(req.body.dateEnd),
    };
    console.log('create one event', eventData);
    return this.eventService.creatEvent(eventData, req, files);
  }

  @Put(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `UpdateEventDto`
  async update(
    @Param('id') eventId: string,
    @Body() event: UpdateEventDto,
  ): Promise<any> {
    console.log('Update one event');
    return this.eventService.updateEvent(eventId, event);
  }

  @Delete(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  async delete(@Param('id') eventId: string): Promise<any> {
    return this.eventService.deleteEvent(eventId);
  }
}
