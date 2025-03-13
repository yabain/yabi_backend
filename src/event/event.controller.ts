/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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
    // console.log('Getting all event');
    return this.eventService.findAll(query);
  }

  @Get(':id')
  async getEvent(@Param('id') eventId: string): Promise<any> {
    // console.log('Getting one event');
    return this.eventService.findById(eventId);
  }

  @Post('new')
  @UseInterceptors(FilesInterceptor('file', 1, multerConfig)) // 'files' est le nom du champ dans le formulaire, 1 est le nombre maximum de fichiers
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
    // console.log('create one event', eventData);
    return this.eventService.creatEvent(eventData, req, files);
  }

  @Put(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  @UsePipes(ValidationPipe) // Valide les données entrantes (body) en utilisant le DTO `UpdateEventDto`
  async update(
    @Param('id') eventId: string,
    @Body() event: UpdateEventDto,
    @Req() req,
  ): Promise<any> {
    // console.log('Update one event, user / autor: ', req.user._id, event.autor);
    // console.log('event data: ', event);
    if (req.user._id != event.autor) throw new Error('Unauthorized');
    return this.eventService.updateEvent(eventId, event);
  }

  @Delete(':id')
  @UseGuards(AuthGuard()) // Applique un garde (guard) pour protéger la route. Ici, `AuthGuard` est utilisé pour vérifier l'authentification.
  async delete(@Param('id') eventId: string): Promise<any> {
    return this.eventService.deleteEvent(eventId);
  }

  @Get('participants/:id')
  async getParticipantsList(@Param('id') eventId: string): Promise<any> {
    // console.log('Getting one event');
    return this.eventService.getParticipantsList(eventId);
  }

  @Get('public-events/:id')
  async getProgressivePublicEventsOfUser(
    @Param('id') eventId: string,
    @Query() query: ExpressQuery,
  ): Promise<any> {
    return this.eventService.getProgressivePublicEventsOfUser(eventId, query);
  }

  @Get('all-my-events/:id')
  @UseGuards(AuthGuard())
  async getProgressiveAllEventsOfUser(
    @Param('id') eventId: string,
    @Req() req,
    @Query() query: ExpressQuery,
  ): Promise<any> {
    console.log('getProgressiveAllEventsOfUser')
    return this.eventService.getProgressiveAllEventsOfUser(req.user._id, query);
  }

  @Get(':id/metadata')
  async getEventMetadata(@Param('id') eventId: string) {
    const event = await this.eventService.findEventById(eventId);

    if (!event) {
      return { error: 'Événement non trouvé' };
    }

    return {
      title: event.title,
      image: event.cover, // Assurez-vous que `cover` contient l'URL de l'image
      description: event.description,
    };
  }
}
