/* eslint-disable @typescript-eslint/no-unsafe-return */
// meta.controller.ts
import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetaService } from './meta.service';

@Controller('event_data')
export class MetaController {
  constructor(private metaService: MetaService) {}

  @Get(':id')
  async getEventMeta(
    @Param('id') eventId: string,
    @Res() res: Response,
    @Req() req,
  ) {
    return this.metaService.getEventMeta(eventId, res, req);
  }
}
