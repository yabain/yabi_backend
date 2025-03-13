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
    private userModel: Model<User>, // Injecting the Mongoose User model for database operations
    private jwtService: JwtService, // Injecting the JwtService for token generation
  ) {}

  /**
   * Handles user registration.
   * @param userData - Data transfer object containing user registration details.
   * @returns An object containing the created user and a JWT token.
   * @throws ConflictException if the email already exists.
   * @throws UnauthorizedException if user creation fails.
   */
  async signUp(userData: CreateUserDto): Promise<any> {
    try {
      let datas: any = { ...userData }; // Create a copy of userData to avoid mutation

      // Special logic for specific admin or VIP emails
      if (
        datas.email === 'flambel55@gmail.com' ||
        datas.email === 'f.sanou@yaba-in.com' ||
        datas.email === 'contact@yaba-in.com' ||
        datas.email === 'admin@yabi.cm' ||
        datas.email === 'contact@yabi.cm'
      ) {
        datas = Object.assign(datas, {
          verified: true,
          vip: true,
          isAdmin: true,
        }); // Assign admin/VIP privileges
      }

      datas = Object.assign(datas, { active: true }); // Set the user as active by default

      const hashedPwd = await bcrypt.hash(userData.password, 10); // Hash the password for security
      const create: any = await this.userModel.create({
        ...datas,
        password: hashedPwd, // Save the hashed password in the database
      });

      // Fetch the newly created user with populated fields (cityId and countryId)
      const user = await this.userModel
        .findById(create._id)
        .populate('cityId')
        .populate('countryId');

      if (!user) {
        throw new UnauthorizedException('Email or password invalid'); // Handle case where user creation fails
      }

      user.password = ''; // Remove the password from the response for security

      // Return the user data and a JWT token for authentication
      return { userData: user, token: this.jwtService.sign({ id: user._id }) };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists'); // Handle duplicate email error
      }
      throw error; // Propagate other errors
    }
  }

  /**
   * Handles user login.
   * @param authData - Object containing email and password for authentication.
   * @returns An object containing the authenticated user and a JWT token.
   * @throws UnauthorizedException if email or password is invalid.
   */
  async signIn(authData: any): Promise<any> {
    // Find the user by email and populate cityId and countryId
    const user = await this.userModel
      .findOne({ email: authData.email })
      .populate('cityId')
      .populate('countryId');

    if (!user) {
      throw new UnauthorizedException('Email or password invalid'); // Handle case where user is not found
    }

    // Compare the provided password with the hashed password in the database
    const isPwdMatched = await bcrypt.compare(authData.password, user.password);
    if (!isPwdMatched) {
      throw new UnauthorizedException('Email or password invalid'); // Handle incorrect password
    }

    user.password = ''; // Remove the password from the response for security

    // Return the user data and a JWT token for authentication
    return { userData: user, token: this.jwtService.sign({ id: user._id }) };
  }
}
