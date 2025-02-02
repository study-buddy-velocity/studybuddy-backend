import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAI } from 'openai';
import { ChatHistory, ChatHistoryDocument } from 'src/schemas/chatHistory.schema';
import { UsersService } from 'src/users/users.service';
import { formatDate, formatTimestampToIOS } from 'src/utils/date_formatter';

@Injectable()
export class ChatService {
    private readonly openai: OpenAI;

    @Inject(UsersService) private readonly usersService: UsersService;
    

    constructor(
        @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})
}
  
    async getChatResponse(userID: string, subject: string, query: string): Promise<string> {

        let userClass = (( await this.usersService.getUserDetailsByUserId(userID)) as String)["class"]
        

      if (!this.isEducationalContent(query)) {
        throw new BadRequestException('Query must be related to educational content.');
      }
  
      const prompt = `You are a helpful assistant providing educational content only. 
        Grade: ${userClass}
        Subject: ${subject}
        Query: ${query}`;
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an educational assistant designed to provide helpful, syllabus-aligned information for students based on the specified subject and grade level (up to PUC). Please follow these guidelines:

                    - Focus on topics typically covered in the syllabus for the given grade level. Provide clear, concise, and accurate explanations suited to the student's understanding.
                    - If a question is about a topic outside the syllabus or unrelated to the subject, respond kindly with:
                      "This question seems outside the usual topics for ${subject} in Grade ${userClass}. Could you please ask something related to this subject?"
                    - For younger students (up to Grade 7), avoid advanced topics like the human reproductive system, evolution, or genetic concepts. Instead, guide them gently with a simpler, age-appropriate explanation or suggest asking these questions when they are older.
                    - Always aim to encourage curiosity while keeping the answers aligned with the student's learning level.
                    - If a question is completely unrelated or unclear, respond with:
                      "Could you please ask a relevant question about ${subject}? I'd love to help you learn!"`
            // content: `You are an educational assistant programmed to provide information strictly within the boundaries of the user's given subject and grade level. The user will specify a subject and grade level (up to PUC). You must follow these rules:

            // Only include topics covered in the syllabus for the given grade level.
            // If a topic is not part of the syllabus for the specified grade, respond with:
            // "This topic is not part of the syllabus for ${subject} in Grade ${userClass}. Please ask about topics relevant to this grade."
            // Till Grade 7, do not provide information on advanced biology topics like the human reproductive system, evolution, or genetic concepts, as these are introduced in higher grades.
            // Provide concise, syllabus-appropriate answers and do not add unnecessary details.
            // Ensure your responses are clear, factual, and aligned with the curriculum for the grade specified.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_completion_tokens:500
      });
  
      const reply = response.choices[0]?.message;
      const totalTokens = response.usage.total_tokens
      this.addQueryResponse(userID, query, reply.content, totalTokens, subject)
  
      if (!reply) {
        throw new BadRequestException('No response received from OpenAI.');
      }
  
      return reply.content;
    }
  
    private isEducationalContent(query: string): boolean {
      const bannedWords = ["adult", "inappropriate", "explicit", "sex"];
      const lowerCaseQuery = query.toLowerCase();
      return !bannedWords.some((word) => lowerCaseQuery.includes(word));
    }

    async addQueryResponse(userId: string, query: string, response: string, tokensUsed: number, subject: string) {
        const today = formatDate(formatTimestampToIOS(String(new Date() )));
    
        const chatHistory = await this.chatHistoryModel.findOne({ userId, date: today });
    
        if (chatHistory) {
          // Check if the subject already exists in subjectWise
        let subjectWise = chatHistory.subjectWise.find((s) => s.subject === subject);

        if (!subjectWise) {
          // If the subject doesn't exist, add a new subject entry
          subjectWise = { subject, queries: [] };
          chatHistory.subjectWise.push(subjectWise);
          
          // Ensure the subject is unique in the subjects array
        if (!chatHistory.subjects.includes(subject)) {
          chatHistory.subjects.push(subject);
          }
        }

    // Add the query-response pair to the existing or newly added subject
    subjectWise.queries.push({ query, response, tokensUsed });

    // Update the total tokens spent
    chatHistory.totalTokensSpent += tokensUsed;

    // Save the updated document
    await chatHistory.save();
  } else {
    // Create a new document if none exists for the user and date
    await this.chatHistoryModel.create({
      userId,
      date: today,
      subjectWise: [
        {
          subject,
          queries: [{ query, response, tokensUsed }],
        },
      ],
      totalTokensSpent: tokensUsed,
      subjects: [subject],
    });
  }
      }

      async getHistoryForDay(userId: string, date: string) {
        const targetDate = formatDate(formatTimestampToIOS(String(new Date(date))));
        // const targetDate = date.substring(1, date.lastIndexOf('"'))
        let result = await this.chatHistoryModel.findOne({userId: userId, date: targetDate}).exec();
        if (result) {
            return {data: result};
        } else {
            throw new NotFoundException("History not found");
        }
        
      }

      async getHistoryofLastFive(userId: string) {
        let result = await this.chatHistoryModel.find({userId: userId}).exec();
        if (result) {
            return {data: result};
        } else {
            throw new NotFoundException("History not found");
        }
        
      }

      async getChatStreak(userId: string) {
        let result = await (await this.chatHistoryModel.find({userId: userId}).exec()).length;
        if (result) {
            return {streak: result};
        } else {
            throw new NotFoundException("History not found");
        }
        
      }

      async getFilteredChatHistory(userId: string, lowerBoundDate: string, upperBoundDate: string) {
        // Ensure dates are valid and normalized
        const startOfLowerBound = formatDate(formatTimestampToIOS(String(new Date(lowerBoundDate))));
        
    
        const startOfUpperBound = formatDate(formatTimestampToIOS(String(new Date(upperBoundDate))));
    
        // Query the database with the date range and project only subjects and date
        return this.chatHistoryModel.find({userId, date: { $gte: startOfLowerBound, $lte: startOfUpperBound },},
            {
              subjects: 1,
              date: 1,
              _id: 0, // Exclude the `_id` field from the result
            },).exec();
      }
}
