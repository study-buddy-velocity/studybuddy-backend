import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatHistory, ChatHistorySchema } from 'src/schemas/chatHistory.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatCleanupService } from './chat-cleanup.service';

@Module({
  imports: [
    UsersModule, 
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
    ScheduleModule.forRoot()
  ],
  providers: [ChatService, ChatCleanupService],
  controllers: [ChatController]
})
export class ChatModule {}
