/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
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
import { FollowService } from './follow.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('follow')
export class FollowController {
  constructor(private followService: FollowService) {}

  @Get('follow-ckeck/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async chekIfIFollows(@Param('id') userId: string, @Req() req): Promise<any> {
    return this.followService.chekIfIFollows(req.user._id, userId);
  }

  @Get('new/:id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async follow(@Param('id') userId: string, @Req() req): Promise<any> {
    return this.followService.follow(req.user._id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard())
  @UsePipes(ValidationPipe)
  async unFollow(@Param('id') userId: string, @Req() req): Promise<any> {
    return this.followService.unFollow(req.user._id, userId);
  }

  @Get('followers')
  @UsePipes(ValidationPipe)
  async getFollowers(@Req() req): Promise<any> {
    return this.followService.getFollowersNumber(req.user._id);
  }

  @Get('followings')
  @UsePipes(ValidationPipe)
  async getFollowings(@Req() req): Promise<any> {
    return this.followService.getFollowingsNumber(req.user._id);
  }
}
