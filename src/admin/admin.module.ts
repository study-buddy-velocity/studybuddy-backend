import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDebugController } from './admin-debug.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Subject, SubjectSchema } from 'src/schemas/subject.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { UserDetails, UserDetailsSchema } from 'src/schemas/userDetails.schema';
import { ChatHistory, ChatHistorySchema } from 'src/schemas/chatHistory.schema';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwtConfig';
import { Quiz, QuizSchema } from 'src/schemas/quiz.schema';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    MongooseModule.forFeature([
      { name: Subject.name, schema: SubjectSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: User.name, schema: UserSchema },
      { name: UserDetails.name, schema: UserDetailsSchema },
      { name: ChatHistory.name, schema: ChatHistorySchema }
    ])
  ],
  controllers: [AdminController, AdminDebugController, AdminAnalyticsController],
  providers: [AdminService, AdminAnalyticsService],
  exports: [AdminService]
})
export class AdminModule {}
