/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/user/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { RevokedTokenSchema } from '../revoked-token/revoked-token.schema';
import { EmailService } from 'src/email/email.service';
import { environment } from 'env';

@Module({
  imports: [
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: () => {
        return {
          secret: environment.JWT_SECRET,
          signOptions: {
            expiresIn: environment.JWT_EXPIRES,
          },
        };
      },
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: 'RevokedToken', schema: RevokedTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
