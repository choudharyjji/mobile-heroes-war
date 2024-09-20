import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { GameSessionController } from './game-session.controller';
import { GameSessionService } from './game-session.service';
import { UsersModule } from 'src/users/users.module';
import { GameSession, GameSessionSchema } from './game-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameSession.name, schema: GameSessionSchema },
    ]),
    UsersModule,
  ],
  controllers: [GameSessionController],
  providers: [GameSessionService],
})
export class GameSessionModule {}
