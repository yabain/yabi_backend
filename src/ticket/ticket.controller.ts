/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTicketDto } from './create-ticket.dto';

@Controller('ticket')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Get('all/:id')
  async getAllTicketsOfEvent(@Param('id') eventId: string): Promise<any> {
    return this.ticketService.getAllTicketsOfEvent(eventId);
  }

  @Get('myTicket/:id')
  @UseGuards(AuthGuard())
  async getAllMyTickets(@Param('id') userId: string): Promise<any> {
    return this.ticketService.getAllMyTickets(userId);
  }

  @Get('ticketData/:id')
  @UseGuards(AuthGuard())
  async getTicketData(@Param('id') ticketId: string): Promise<any> {
    return this.ticketService.getTicketData(ticketId);
  }

  @Post('new')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async createFreeTicket(
    @Body() ticket: CreateTicketDto,
    @Req() req,
  ): Promise<any> {
    return this.ticketService.createFreeTicket(ticket, req.user._id);
  }

  @Get('participantStatus/:id')
  @UseGuards(AuthGuard())
  async checkParticipantsStatus(
    @Param('id')
    eventId: string,
    @Req() req,
  ): Promise<any> {
    return this.ticketService.checkParticipantsStatus(eventId, req.user._id);
  }
}
