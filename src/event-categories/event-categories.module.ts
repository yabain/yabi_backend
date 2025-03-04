import { Module } from '@nestjs/common';
import { EventCategoriesService } from './event-categories.service';
import { EventCategoriesController } from './event-categories.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventCategories,
  EventCategoriesSchema,
} from './event-categories.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: EventCategories.name, schema: EventCategoriesSchema },
    ]),
  ],
  providers: [EventCategoriesService],
  controllers: [EventCategoriesController],
})
export class EventCategoriesModule {}
