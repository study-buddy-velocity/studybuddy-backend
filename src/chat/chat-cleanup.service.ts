import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatHistory } from 'src/schemas/chatHistory.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { formatDate, formatTimestampToIOS } from 'src/utils/date_formatter';

@Injectable()
export class ChatCleanupService {
    constructor(
        @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistory>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupOldChatHistory() {
        try {
            // Get the date 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const formattedDate = formatDate(formatTimestampToIOS(String(sevenDaysAgo)));

            // Delete documents older than 7 days
            const result = await this.chatHistoryModel.deleteMany({
                date: { $lt: formattedDate }
            });

            // //console.log(`Deleted ${result.deletedCount} old chat history documents`);
        } catch (error) {
            console.error('Error cleaning up chat history:', error);
        }
    }
} 