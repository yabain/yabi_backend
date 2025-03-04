/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from 'src/user/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(userData: CreateUserDto): Promise<any> {
    try {
      let datas: any = { ...userData };
      if (
        datas.email === 'flambel55@gmail.com' ||
        datas.email === 'f.sanou@yaba-in.com' ||
        datas.email === 'contact@yaba-in.com' ||
        datas.email === 'contact@yabi.cm'
      ) {
        datas = Object.assign(datas, { verified: true });
        datas = Object.assign(datas, { vip: true });
        datas = Object.assign(datas, { isAdmin: true });
      }
      datas = Object.assign(datas, { active: true });
      const hashedPwd = await bcrypt.hash(userData.password, 10);
      const user: any = await this.userModel.create({
        ...datas,
        password: hashedPwd,
      });
      user.password = '';

      return { userData: user, token: this.jwtService.sign({ id: user._id }) };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error; // Propager les autres erreurs
    }
  }

  async signIn(authData: any): Promise<any> {
    const user = await this.userModel.findOne({ email: authData.email });
    if (!user) {
      throw new UnauthorizedException('Email or password invalid');
    }

    const isPwdMatched = await bcrypt.compare(authData.password, user.password);
    if (!isPwdMatched) {
      throw new UnauthorizedException('Email or password invalid');
    }
    user.password = '';

    return { userData: user, token: this.jwtService.sign({ id: user._id }) };
  }
}
