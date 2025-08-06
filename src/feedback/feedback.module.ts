import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from 'src/schemas/feedback.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema }
    ]),
    UsersModule
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService]
})
export class FeedbackModule {}