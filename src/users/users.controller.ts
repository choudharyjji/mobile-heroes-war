import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Request,
  UnauthorizedException,
  UseGuards,
  Req,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from './schemas/user.schema';
import { UpdateUserRankDto } from './dto/update-rank.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserInventoryDto } from './dto/inventory.dto';
import { Types } from 'mongoose';
import { SkipAuth } from 'src/auth/auth.decorator';
import { AddItemDto } from './dto/add-item.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch('update-rank-server')
  async updateUserRank(
    @Request() req,
    @Body() updateUserDto: UpdateUserRankDto,
  ): Promise<User> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7, authHeader.length);
      const payload = await this.jwtService.verify(token, {
        secret: process.env.SECRET_KEY,
      });

      if (payload.role != 'server') {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
    return this.userService.updateUserRank(updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-user-server/:userInput')
  async getProfileServer(@Req() req, @Param('userInput') userId: string) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7, authHeader.length);
      const payload = await this.jwtService.verify(token, {
        secret: process.env.SECRET_KEY,
      });

      if (payload.role != 'server') {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
    const user = await this.userService.findUserByIdOrName(userId);
    if (user) {
      const payload = {
        userId: user._id,
        rating: user.rating,
        rankpoints: user.rankpoints,
      };
      return payload;
    }
    throw new UnauthorizedException();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('updateUser')
  async updateUserNameOrPassword(
    @Req() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const id = req.user._id;

    return await this.userService.updateUser(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.findUserByIdOrName(req.user._id);
  }
  @UseGuards(JwtAuthGuard)
  @Get('leader')
  async getLeader(): Promise<User[]> {
    return await this.userService.getTopRankUser();
  }
  @UseGuards(JwtAuthGuard)
  @Get('get-rank')
  async getUserRank(@Request() req) {
    return await this.userService.getUserRank(req.user._id);
  }
  @UseGuards(JwtAuthGuard)
  @Get('get-inventory')
  async getUserInventory(@Request() req): Promise<UserInventoryDto> {
    return this.userService.getUserInventory(req.user._id);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':itemId/equip-item')
  async equipItem(@Param('itemId') itemId: string, @Request() req) {
    console.log(`Received itemId: ${itemId}`);
    const item = await this.userService.equipItem(req.user._id, itemId);
    return item;
  }
  @UseGuards(JwtAuthGuard)
  @Get('get-allplayers-equipped')
  async getEquippedItems(@Body('userIds') userIds: string[]): Promise<any[]> {
    // const userIdArray = userIds.split(',').map(id => id.trim());
    const objectIdArray = userIds.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ObjectId: ${id}`);
      }
      return new Types.ObjectId(id);
    });
    return this.userService.getEquippedItemsForUsers(objectIdArray);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userInput')
  async FindUserWithNameOrId(@Param('userInput') userInput: string) {
    const user = await this.userService.findUserByIdOrName(userInput);
    if (user) {
      const payload = { id: user._id, ingameName: user.name };
      return payload;
    }
    throw new UnauthorizedException();
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  getAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @SkipAuth()
  @Post('add-item')
  async addItemToUserInventory(@Body() addItemDto: AddItemDto) {
    try {
      const { userId, itemId, quantity } = addItemDto;
      return await this.userService.addItemToUserInventory(
        userId,
        itemId,
        quantity,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
