import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { AuthService } from 'src/auth/auth.service';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [FriendController],
  providers: [FriendService, AuthService],
})
export class FriendModule {}
