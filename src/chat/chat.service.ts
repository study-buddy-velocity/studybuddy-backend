// chat.service.ts (updated)
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
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    private isPreviousQuery(query: string): boolean {
        const q = query.toLowerCase();
        return q.includes('previous') || q.includes('last') || q.includes('before') || q.includes('earlier');
    }

    async getChatResponse(userID: string, subject: string, query: string, topic?: string): Promise<string> {
        let userClass = ((await this.usersService.getUserDetailsByUserId(userID)) as String)["class"];

        const lastTwoChats = await this.chatHistoryModel
            .find({ userId: userID })
            .sort({ createdAt: -1 })
            .limit(2)
            .exec();

        if (!this.isEducationalContent(query)) {
            throw new BadRequestException('Query must be related to educational content.');
        }

        if (this.isPreviousQuery(query)) {
            const lastChat = lastTwoChats.find(
                (chat) =>
                    chat.subjectWise?.some(
                        (s) =>
                            s.subject === subject &&
                            s.queries?.length > 0 &&
                            s.queries[s.queries.length - 1].query.toLowerCase() !== query.toLowerCase(),
                    ),
            );

            const subjectWise = lastChat?.subjectWise?.find((s) => s.subject === subject);
            const lastValidQuery = subjectWise?.queries?.slice(-1)[0];

            if (!lastValidQuery) {
                return "I couldn't find a previous educational question to elaborate on.";
            }

            const followUpPrompt = `This is a follow-up to a previous question asked by the student.

Previous Question: ${lastValidQuery.query}
Previous Answer: ${lastValidQuery.response}
New Request: ${query}

Please elaborate on the previous topic and give a clearer or deeper explanation. At the end, include a <summary>Q: ... A: ...</summary>`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an educational assistant providing clear and age-appropriate explanations for students up to PUC level. Respond based on the student's previous question and your earlier answer.`,
                    },
                    {
                        role: 'user',
                        content: followUpPrompt,
                    },
                ],
                temperature: 0.2,
            });

            const reply = response.choices[0]?.message;
            const totalTokens = response.usage.total_tokens;

            if (!reply || !reply.content) {
                throw new BadRequestException('No response received from OpenAI.');
            }

            const summaryMatch = reply.content.match(/<summary>(.*?)<\/summary>/);
            const summary = summaryMatch ? summaryMatch[1].trim() : '';
            const cleanResponse = reply.content.replace(/<summary>.*?<\/summary>/s, '').trim();

            await this.addQueryResponse(userID, query, cleanResponse, totalTokens, subject, summary);

            return cleanResponse;
        }

        // Filter previous context to only include the current subject and topic
        const filteredPreviousContext = lastTwoChats
            .flatMap(chat => chat.subjectWise
                .filter(subjectWise => subjectWise.subject === subject && (!topic || subjectWise.queries.some(q => q.query.toLowerCase().includes(topic.toLowerCase()) || q.response.toLowerCase().includes(topic.toLowerCase()))))
                .flatMap(subjectWise => subjectWise.queries
                    .filter(q => q.summary)
                    .map(q => q.summary)
                )
            )
            .join('\n');

        const prompt = `You are a friendly and supportive educational assistant for students in grades 6 to 12. Always answer based on the student's class, the selected subject, and the specific topic if provided. If the question is not related to the subject or topic, or is inappropriate, gently guide the student back to academic topics with kindness and encouragement. Never provide explicit or inappropriate content, but do not scold—be positive and helpful.

IMPORTANT: Only answer questions about the current subject: ${subject}${topic ? ` and topic: ${topic}` : ''}. If the question is about something else, politely say you can only answer about this subject and topic, and encourage the student to ask relevant questions.

Student Grade: ${userClass}
Subject: ${subject}${topic ? `\nTopic: ${topic}` : ''}
Previous Context: ${filteredPreviousContext}
Student's Question: ${query}`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a friendly, supportive educational assistant for students in grades 6 to 12. Your job is to:
- Answer questions based on the student's grade, the selected subject, and the specific topic (if provided).
- If a question is vulgar, inappropriate, or unrelated to the subject/topic, respond kindly and encourage the student to ask academic questions. For example, say: "I'm here to help you learn about ${subject}${topic ? `, especially the topic '${topic}'` : ''}. Let's focus on your studies!"
- Never provide explicit, adult, or inappropriate content. If asked, gently redirect the conversation to academic topics.
- Use clear, age-appropriate language and encourage curiosity.
- IMPORTANT: If the question is about a different subject or topic, politely inform the student that you can only answer about '${subject}'${topic ? ` and the topic '${topic}'` : ''}, and encourage them to ask relevant questions.
- At the end of each response, include a concise summary in the format: <summary>Q: [Student's Question] A: [One-line summary of your response]</summary> (for internal use only, not shown to the student).`
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2,
        });

        const reply = response.choices[0]?.message;
        const totalTokens = response.usage.total_tokens;

        if (!reply) {
            throw new BadRequestException('No response received from OpenAI.');
        }

        const summaryMatch = reply.content.match(/<summary>(.*?)<\/summary>/);
        const summary = summaryMatch ? summaryMatch[1] : '';
        const cleanResponse = reply.content.replace(/<summary>.*?<\/summary>/s, '').trim();

        await this.addQueryResponse(userID, query, cleanResponse, totalTokens, subject, summary);

        return cleanResponse;
    }

    private isEducationalContent(query: string): boolean {
        const bannedWords = ["adult", "inappropriate", "explicit", "sex"];
        const lowerCaseQuery = query.toLowerCase();
        if (this.isPreviousQuery(query)) return true;
        return !bannedWords.some((word) => lowerCaseQuery.includes(word));
    }

    async addQueryResponse(userId: string, query: string, response: string, tokensUsed: number, subject: string, summary: string) {
        const today = formatDate(formatTimestampToIOS(String(new Date())));
        const chatHistory = await this.chatHistoryModel.findOne({ userId, date: today });

        if (chatHistory) {
            let subjectWise = chatHistory.subjectWise.find((s) => s.subject === subject);
            if (!subjectWise) {
                subjectWise = { subject, queries: [] };
                chatHistory.subjectWise.push(subjectWise);
                if (!chatHistory.subjects.includes(subject)) {
                    chatHistory.subjects.push(subject);
                }
            }
            subjectWise.queries.push({ query, response, tokensUsed, summary });
            chatHistory.totalTokensSpent += tokensUsed;
            await chatHistory.save();
        } else {
            await this.chatHistoryModel.create({
                userId,
                date: today,
                subjectWise: [{ subject, queries: [{ query, response, tokensUsed, summary }] }],
                totalTokensSpent: tokensUsed,
                subjects: [subject],
            });
        }
    }

    async getHistoryForDay(userId: string, date: string) {
        const targetDate = formatDate(formatTimestampToIOS(String(new Date(date))));
        let result = await this.chatHistoryModel.findOne({ userId: userId, date: targetDate }).exec();
        if (result) {
            return { data: result };
        } else {
            throw new NotFoundException("History not found");
        }
    }

    async getHistoryofLastFive(userId: string) {
        let result = await this.chatHistoryModel.find({ userId: userId }).exec();
        if (result) {
            return { data: result };
        } else {
            throw new NotFoundException("History not found");
        }
    }

    async getChatStreak(userId: string) {
        try {
            const chatHistories = await this.chatHistoryModel.find({ userId: userId }).exec();
            const streak = chatHistories.length;
            return { streak: streak };
        } catch (error) {
            // Return 0 streak if there's any error or no history found
            return { streak: 0 };
        }
    }

    async getFilteredChatHistory(userId: string, lowerBoundDate: string, upperBoundDate: string) {
        const startOfLowerBound = formatDate(formatTimestampToIOS(String(new Date(lowerBoundDate))));
        const startOfUpperBound = formatDate(formatTimestampToIOS(String(new Date(upperBoundDate))));

        return this.chatHistoryModel.find(
            {
                userId,
                date: { $gte: startOfLowerBound, $lte: startOfUpperBound },
            },
            {
                subjects: 1,
                date: 1,
                _id: 0,
            },
        ).exec();
    }
}
