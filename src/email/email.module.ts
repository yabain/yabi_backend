import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { DateService } from './date.service';

@Module({
  providers: [EmailService, DateService],
  controllers: [EmailController],
})
export class EmailModule {}
