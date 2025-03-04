import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { CountryModule } from './country/country.module';
import { CityModule } from './city/city.module';
import { SystemModule } from './system/system.module';
import { EventCategoriesModule } from './event-categories/event-categories.module';
import { TicketClassesModule } from './ticket-classes/ticket-classes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      `mongodb+srv://yabi_events:Entreprise1230@yabievents.xx9vf.mongodb.net/?retryWrites=true&w=majority&appName=YabiEvents`,
    ),
    UserModule,
    AuthModule,
    EventModule,
    CountryModule,
    CityModule,
    SystemModule,
    EventCategoriesModule,
    TicketClassesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
