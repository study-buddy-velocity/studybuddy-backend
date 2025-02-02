import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UsersModule } from 'src/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatHistory, ChatHistorySchema } from 'src/schemas/chatHistory.schema';

@Module({
  imports: [UsersModule, 
    MongooseModule.forFeature([{ name: ChatHistory.name, schema: ChatHistorySchema }]),
  ],
  providers: [ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
