import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { User, UserSchema } from 'src/schemas/user.schema';
import { UserDetails, UserDetailsSchema } from 'src/schemas/userDetails.schema';
import { ChatHistory, ChatHistorySchema } from 'src/schemas/chatHistory.schema';
import jwtConfig from 'src/config/jwtConfig';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserDetails.name, schema: UserDetailsSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema }
    ])
  ],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService]
})
export class LeaderboardModule {}
