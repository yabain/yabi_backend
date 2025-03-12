/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() userData: CreateUserDto): Promise<{ token: string }> {
    // console.log('SignUp of new user');
    return this.authService.signUp(userData);
  }

  @Post('/signin')
  signIn(@Body() authData: any): Promise<{ token: string }> {
    return this.authService.signIn(authData);
  }
}
