import { Controller, Get } from '@nestjs/common';
import { System } from './system.schema';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get()
  async getData(): Promise<System[]> {
    console.log('getting system data');
    return this.systemService.getData();
  }
}
