/* eslint-disable @typescript-eslint/require-await */
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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AheadService } from './ahead.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateAheadDto } from './create-ahead.dto';

@Controller('ahead')
export class AheadController {
  constructor(private aheadService: AheadService) {}

  @Get(':id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async chekIfEventIsInAhead(@Param('id') evenId: string): Promise<any> {
    return this.aheadService.chekIfEventIsInAheads(evenId);
  }

  @Post('new')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async addToFavorites(
    @Body() ahead: CreateAheadDto,
    @Req() req,
  ): Promise<any> {
    const aheadData = {
      ...ahead,
      userId: req.user._id,
    };
    if (!req.user.isAdmin) throw new Error('Unauthorized');
    return this.aheadService.addToAhead(aheadData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async removeToAheads(@Param('id') eventId: string, @Req() req): Promise<any> {
    if (!req.user.isAdmin) throw new Error('Unauthorized');
    return this.aheadService.removeToAheads(eventId);
  }
}
