// Enhanced chat.service.ts - Complete implementation with improved system prompts and random responses

import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAI } from 'openai';
import { ChatHistory, ChatHistoryDocument } from 'src/schemas/chatHistory.schema';
import { UsersService } from 'src/users/users.service';
import { formatDate, formatTimestampToIOS } from 'src/utils/date_formatter';
import { Subject } from 'src/schemas/subject.schema';

@Injectable()
export class ChatService {
    private readonly openai: OpenAI;

    @Inject(UsersService) private readonly usersService: UsersService;

    constructor(
        @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
        @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    ) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    private looksLikeObjectId(value?: string): boolean {
        return !!value && /^[a-f0-9]{24}$/i.test(value);
    }

    private async resolveSubjectAndTopicNames(subjectInput: string, topicInput?: string): Promise<{ subjectName: string, topicName?: string }> {
        let subjectName = subjectInput;
        let topicName = topicInput;

        try {
            let subjectDoc: any = null;

            // 1) Try to resolve subject
            if (this.looksLikeObjectId(subjectInput)) {
                subjectDoc = await this.subjectModel.findById(subjectInput).exec();
                if (subjectDoc?.name) {
                    subjectName = subjectDoc.name;
                }
            } else if (subjectInput) {
                subjectDoc = await this.subjectModel.findOne({ name: subjectInput }).exec();
                if (subjectDoc?.name) {
                    subjectName = subjectDoc.name;
                }
            }

            // 2) Try to resolve topic and (if needed) subject by topic
            if (topicInput) {
                if (subjectDoc) {
                    // We already have the subject; try to resolve topic within it
                    if (this.looksLikeObjectId(topicInput)) {
                        const match = subjectDoc.topics?.find((t: any) => String(t._id) === String(topicInput));
                        if (match?.name) topicName = match.name;
                    } else {
                        // Assume it's already a readable topic name
                        topicName = topicInput;
                    }
                } else {
                    // We don't have a subject doc yet; try to find subject by topic
                    if (this.looksLikeObjectId(topicInput)) {
                        const foundByTopicId = await this.subjectModel.findOne({ 'topics._id': topicInput }).exec();
                        if (foundByTopicId) {
                            subjectDoc = foundByTopicId;
                            subjectName = foundByTopicId.name;
                            const match = foundByTopicId.topics?.find((t: any) => String(t._id) === String(topicInput));
                            if (match?.name) topicName = match.name;
                        }
                    } else {
                        // Topic provided as name — try to find subject by topic name
                        const foundByTopicName = await this.subjectModel.findOne({ 'topics.name': topicInput }).exec();
                        if (foundByTopicName) {
                            subjectDoc = foundByTopicName;
                            subjectName = foundByTopicName.name;
                            const match = foundByTopicName.topics?.find((t: any) => String(t.name).toLowerCase() === String(topicInput).toLowerCase());
                            if (match?.name) topicName = match.name;
                        }
                    }
                }
            }
        } catch (e) {
            // Fail silently; we'll fallback to inputs
        }

        // Final safety: if topic still looks like an ID (unresolved), drop it to avoid leaking IDs in prompts/UI
        if (topicName && this.looksLikeObjectId(topicName)) {
            topicName = undefined;
        }
        return { subjectName, topicName };
    }

    // Random friendly responses for different scenarios
    private getRandomOffTopicResponse(subject: string, topic?: string): string {
        const responses = [
            `That's an interesting question! 🤔 But right now I'm your ${subject} buddy${topic ? ` focusing on ${topic}` : ''}. What would you like to explore about ${subject} today?`,
            
            `I love your curiosity! 🌟 However, I'm specially designed to help you master ${subject}${topic ? `, particularly ${topic}` : ''}. What ${subject} concept can I help you understand better?`,
            
            `Great question, but let's keep our focus on ${subject}${topic ? ` and ${topic}` : ''} for now! 📚 Is there something specific in ${subject} that's been puzzling you?`,
            
            `I appreciate your curiosity! 😊 Right now, I'm your dedicated ${subject} learning companion${topic ? ` for ${topic}` : ''}. What ${subject} challenge can we tackle together?`,
            
            `That's a thoughtful question! However, my expertise is in helping you with ${subject}${topic ? `, especially ${topic}` : ''}. What would you like to learn or review in ${subject} today?`,
            
            `I can see you're thinking broadly! 🚀 But let's channel that curiosity into ${subject}${topic ? ` and dive deeper into ${topic}` : ''}. What part of ${subject} interests you most?`,
            
            `You're full of questions - I love that! 💡 But I'm here specifically to help you excel in ${subject}${topic ? `, particularly with ${topic}` : ''}. What's something in ${subject} you'd like to master?`,
            
            `That's a creative question! 🎨 Right now though, let's focus on making you amazing at ${subject}${topic ? ` and understanding ${topic} better` : ''}. What would you like to discover in ${subject}?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private getRandomInappropriateResponse(subject: string): string {
        const responses = [
            `Let's keep our conversation positive and educational! 😊 I'm here to help you excel in ${subject}. What topic would you like to explore?`,
            
            `I'm designed to be your friendly ${subject} tutor! 📖 Let's focus on learning something amazing in ${subject} today. What interests you?`,
            
            `Hey there! Let's use our time together to boost your ${subject} knowledge! 🎯 What concept can I help clarify for you?`,
            
            `I'm your study buddy for ${subject}! 📝 Let's make learning fun and engaging. What would you like to discover in ${subject}?`,
            
            `I'm here to make ${subject} exciting for you! ✨ What topic or concept can we explore together today?`,
            
            `Let's turn that energy into learning power! 💪 I'm here to help you succeed in ${subject}. What would you like to understand better?`,
            
            `I prefer to keep things educational and fun! 🎓 What ${subject} concept has been on your mind lately?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    private getPersonalizedSystemPrompt(userClass: string, subject: string, topic?: string): string {
        return `You are Alex, an enthusiastic and supportive AI tutor who specializes in ${subject} for students in grades 6-12. You have a warm, encouraging personality and love helping students discover the joy in learning.

PERSONALITY TRAITS:
- Always encouraging and positive, celebrating small wins
- Use age-appropriate enthusiasm (occasional emojis, but not overwhelming)
- Patient and understanding when students struggle
- Make learning feel like an adventure, not a chore
- Relate concepts to real-world examples students can understand
- Speak like a friendly, knowledgeable older sibling or mentor

CORE RESPONSIBILITIES:
- Help grade ${userClass} students master ${subject}${topic ? `, focusing on ${topic}` : ''}
- Explain concepts in multiple ways if needed
- Ask engaging follow-up questions to deepen understanding
- Provide practical examples and memory tricks
- Encourage questions and curiosity within the subject area
- Break down complex topics into digestible, manageable parts

HANDLING OFF-TOPIC QUESTIONS:
- If asked about other subjects: Acknowledge their curiosity positively, then redirect with variety
- If inappropriate content: Respond kindly but firmly redirect to learning
- Use different phrasing each time to avoid sounding robotic
- Never be harsh or dismissive - always maintain warmth

RESPONSE STYLE:
- Start with encouragement or acknowledgment of their question
- Break complex topics into digestible parts with clear explanations
- Use analogies and examples relevant to their grade level and interests
- Include practical applications and "why this matters" context
- End with engagement (question, challenge, or encouragement to explore more)
- Keep responses conversational and engaging, not lecture-like
- Adjust complexity based on grade ${userClass} level

IMPORTANT GUIDELINES:
- NEVER provide inappropriate, adult, or harmful content
- If uncertain about appropriateness, err on the side of educational focus
- Celebrate mistakes as learning opportunities
- Encourage critical thinking and asking "why" and "how"
- Make every student feel capable and intelligent

At the end of each response, include: <summary>Q: [Student's Question] A: [Concise summary]</summary>`;
    }

    private getFollowUpSystemPrompt(userClass: string, subject: string): string {
        return `You are Alex, a patient and enthusiastic AI tutor helping a grade ${userClass} student with ${subject}. 

The student is asking for clarification or elaboration on a previous topic. This is EXCELLENT - it shows they're engaged and want to truly understand! Your job is to:

- Celebrate their curiosity and willingness to ask follow-up questions
- Provide a clearer, deeper, or alternative explanation using different approaches
- Use new examples, analogies, or demonstrations they might relate to better
- Break down any complex parts they might have missed into smaller steps
- Check their understanding with gentle questions
- Be encouraging about their learning process - asking questions is smart!
- Make the explanation more engaging and memorable than before

TONE: Enthusiastic about their follow-up question, patient with their learning process, and determined to help them truly "get it" this time.

Remember: The best students are the ones who ask questions when they don't understand. This shows great learning habits!`;
    }

    private isPreviousQuery(query: string): boolean {
        const q = query.toLowerCase();
        const previousIndicators = [
            'previous', 'last', 'before', 'earlier', 'explain more', 'tell me more', 
            'clarify', "didn't understand", 'confused', 'elaborate', 'expand on',
            'more detail', 'not clear', 'unclear', 'help me understand', 'still confused',
            'can you explain again', 'what do you mean', 'i don\'t get it'
        ];
        
        return previousIndicators.some(indicator => q.includes(indicator));
    }

    private isEducationalContent(query: string): boolean {
        // Enhanced detection for inappropriate content
        const inappropriateWords = [
            "adult", "explicit", "sex", "porn", "nude", "naked", "violence", "violent",
            "drug", "drugs", "alcohol", "beer", "wine", "suicide", "kill", "death",
            "self-harm", "hate", "racism", "racist", "bullying", "bully", "fight",
            "weapon", "gun", "knife", "bomb", "terror", "curse", "swear", "damn",
            "hell", "shit", "fuck", "stupid", "idiot", "dumb"
        ];
        
        const lowerCaseQuery = query.toLowerCase();
        
        if (this.isPreviousQuery(query)) return true;
        
        // Check for inappropriate content
        if (inappropriateWords.some(word => lowerCaseQuery.includes(word))) {
            return false;
        }
        
        return true; // Allow off-topic questions but handle them in the response
    }

    private isOffTopic(query: string, subject: string, topic?: string): boolean {
        const lowerQuery = query.toLowerCase();
        const lowerSubject = subject.toLowerCase();

        // If topic provided, be permissive: treat as on-topic unless clearly unrelated to education
        if (topic && topic.trim().length > 0) {
            const lt = topic.toLowerCase();
            // If the query mentions the topic or contains overlapping words, it's on-topic
            const topicWords = lt.split(/\s+/);
            const hasOverlap = topicWords.some(tw => lowerQuery.includes(tw));
            if (hasOverlap || lowerQuery.includes(lowerSubject)) {
                return false;
            }
        }

        // Personal questions about the AI
        const personalQuestions = [
            "what's your name", "what is your name", "how old are you", "what do you look like",
            "where are you from", "do you have feelings", "are you real", "are you human",
            "what's your favorite", "what is your favorite", "do you like", "do you love",
            "where do you live", "what do you do", "who created you", "who made you",
            "are you married", "do you have friends", "what's your birthday"
        ];

        // Other subjects (expand based on your available subjects)
        const otherSubjects = [
            "history", "geography", "music", "art", "sports", "games", "gaming",
            "movies", "tv shows", "television", "celebrities", "politics", "religion",
            "cooking", "animals", "pets", "weather", "news", "current events",
            "technology", "computers", "phones", "social media", "instagram", "tiktok",
            "youtube", "netflix", "anime", "manga", "books", "novels"
        ];

        // General conversation starters
        const casualConversation = [
            "how are you", "what's up", "hello", "hi there", "good morning",
            "good afternoon", "good evening", "how's your day", "what's new",
            "tell me a joke", "make me laugh", "i'm bored", "what should i do"
        ];

        // Check if it's a personal question
        if (personalQuestions.some(pattern => lowerQuery.includes(pattern))) {
            return true;
        }

        // Check for casual conversation
        if (casualConversation.some(pattern => lowerQuery.includes(pattern))) {
            return true;
        }

        // Check if it's about other subjects (only if current query doesn't contain current subject)
        if (!lowerQuery.includes(lowerSubject) &&
            otherSubjects.some(otherSubject => lowerQuery.includes(otherSubject))) {
            return true;
        }

        // If topic is specified, check if query is related to the topic with more flexibility
        if (topic && !lowerQuery.includes(topic.toLowerCase()) &&
            !lowerQuery.includes(lowerSubject)) {
            const topicWords = topic.toLowerCase().split(/\s+/);
            const queryWords = lowerQuery.split(/\s+/);
            const hasTopicConnection = topicWords.some(topicWord =>
                queryWords.some(queryWord =>
                    queryWord.includes(topicWord) || topicWord.includes(queryWord)
                )
            );

            if (!hasTopicConnection) {
                return true;
            }
        }

        return false;
    }

    async getChatResponse(userID: string, subject: string, query: string, topic?: string): Promise<string> {
        let userClass = ((await this.usersService.getUserDetailsByUserId(userID)) as String)["class"];

        // Resolve IDs to human-friendly names if needed
        const { subjectName, topicName } = await this.resolveSubjectAndTopicNames(subject, topic);

        const lastTwoChats = await this.chatHistoryModel
            .find({ userId: userID })
            .sort({ createdAt: -1 })
            .limit(2)
            .exec();

        if (!this.isEducationalContent(query)) {
            // Return random inappropriate content response
            const response = this.getRandomInappropriateResponse(subjectName);
            await this.addQueryResponse(userID, query, response, 0, subjectName, `Q: ${query} A: Redirected inappropriate question`, topicName);
            return response;
        }

        // Check if it's an off-topic question (be lenient if topic is provided)
        const treatAsOffTopic = !topicName && this.isOffTopic(query, subjectName, undefined);
        if (treatAsOffTopic) {
            const response = this.getRandomOffTopicResponse(subjectName, topicName);
            await this.addQueryResponse(userID, query, response, 0, subjectName, `Q: ${query} A: Redirected off-topic question`, topicName);
            return response;
        }

        if (this.isPreviousQuery(query)) {
            const lastChat = lastTwoChats.find(
                (chat) =>
                    chat.subjectWise?.some(
                        (s) =>
                            (s.subject === subjectName || s.subject === subject) &&
                            s.queries?.length > 0 &&
                            s.queries[s.queries.length - 1].query.toLowerCase() !== query.toLowerCase(),
                    ),
            );

            const subjectWise = lastChat?.subjectWise?.find((s) => s.subject === subjectName || s.subject === subject);
            const lastValidQuery = subjectWise?.queries?.slice(-1)[0];

            if (!lastValidQuery) {
                const encouragingResponses = [
                    `I couldn't find a previous question to elaborate on, but that's totally fine! 😊 What would you like to learn about in ${subject} today?`,
                    `No worries - let's start fresh! What ${subject} topic has been on your mind lately? 🤔`,
                    `Let's dive into something new in ${subject}! What concept would you like to explore? 🚀`,
                    `Perfect opportunity for a new ${subject} adventure! What would you like to discover today? ✨`
                ];
                return encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)];
            }

            const followUpPrompt = `The student is asking for clarification on a previous topic. They want to understand better!

Previous Question: ${lastValidQuery.query}
Previous Answer: ${lastValidQuery.response}
Student's New Request: ${query}

Please provide a clearer, more detailed explanation or approach the topic from a different angle. Make it more engaging and easier to understand. Use different examples or analogies. Celebrate their willingness to ask follow-up questions - this shows great learning habits!`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: this.getFollowUpSystemPrompt(userClass, subjectName),
                    },
                    {
                        role: 'user',
                        content: followUpPrompt,
                    },
                ],
                temperature: 0.4, // Higher for more varied responses
            });

            const reply = response.choices[0]?.message;
            const totalTokens = response.usage.total_tokens;

            if (!reply || !reply.content) {
                throw new BadRequestException('No response received from OpenAI.');
            }

            const summaryMatch = reply.content.match(/<summary>(.*?)<\/summary>/);
            const summary = summaryMatch ? summaryMatch[1].trim() : '';
            const cleanResponse = reply.content.replace(/<summary>.*?<\/summary>/s, '').trim();

            await this.addQueryResponse(userID, query, cleanResponse, totalTokens, subjectName, summary, topicName);

            return cleanResponse;
        }

        // Filter previous context to only include the current subject and topic
        const filteredPreviousContext = lastTwoChats
            .flatMap(chat => chat.subjectWise
                .filter(subjectWise => (subjectWise.subject === subjectName || subjectWise.subject === subject) && (!topicName || subjectWise.queries.some(q => (q.topic && q.topic === topicName) || q.query.toLowerCase().includes(topicName.toLowerCase()) || q.response.toLowerCase().includes(topicName.toLowerCase()))))
                .flatMap(subjectWise => subjectWise.queries
                    .filter(q => q.summary)
                    .map(q => q.summary)
                )
            )
            .join('\n');

        const prompt = `Student Context:
Grade Level: ${userClass}
Subject: ${subjectName}${topicName ? `\nTopic Focus: ${topicName}` : ''}
Previous Learning Context: ${filteredPreviousContext || 'This is a fresh start - no previous context available'}

Student's Question: "${query}"

Please provide a helpful, engaging response that:
- Matches their grade ${userClass} level
- Keeps them excited about learning ${subjectName}
- Answers their question thoroughly but in an age-appropriate way
- Encourages further exploration of the topic
- Uses examples they can relate to`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: this.getPersonalizedSystemPrompt(userClass, subjectName, topicName),
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.4, // Higher temperature for more varied, engaging responses
        });

        const reply = response.choices[0]?.message;
        const totalTokens = response.usage.total_tokens;

        if (!reply) {
            throw new BadRequestException('No response received from OpenAI.');
        }

        const summaryMatch = reply.content.match(/<summary>(.*?)<\/summary>/);
        const summary = summaryMatch ? summaryMatch[1] : '';
        const cleanResponse = reply.content.replace(/<summary>.*?<\/summary>/s, '').trim();

        await this.addQueryResponse(userID, query, cleanResponse, totalTokens, subjectName, summary, topicName);

        return cleanResponse;
    }

    async addQueryResponse(userId: string, query: string, response: string, tokensUsed: number, subject: string, summary: string, topic?: string) {
        console.log('=== ADD QUERY RESPONSE DEBUG ===');
        console.log('Topic parameter received:', { topic, topicType: typeof topic, topicLength: topic?.length });

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
            subjectWise.queries.push({ query, response, tokensUsed, summary, topic });
            chatHistory.totalTokensSpent += tokensUsed;

            // Initialize topics array if it doesn't exist (for backward compatibility)
            if (!chatHistory.topics) {
                chatHistory.topics = [];
            }

            // Add topic to topics array if it doesn't exist and topic is provided
            if (topic && topic.trim() !== '' && !chatHistory.topics.includes(topic)) {
                chatHistory.topics.push(topic);
            }

            await chatHistory.save();
        } else {
            await this.chatHistoryModel.create({
                userId,
                date: today,
                subjectWise: [{ subject, queries: [{ query, response, tokensUsed, summary, topic }] }],
                totalTokensSpent: tokensUsed,
                subjects: [subject],
                topics: topic ? [topic] : [],
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

    async getRecentTopics(userId: string) {
        console.log(`[getRecentTopics] Fetching recent topics for user: ${userId}`);

        const result = await this.chatHistoryModel.find({ userId: userId }).exec();
        if (!result || result.length === 0) {
            console.log(`[getRecentTopics] No chat history found for user: ${userId}`);
            return { data: [] };
        }

        // Get topics from individual queries only (most reliable source)
        const queryTopics = result.reduce((acc: string[], item) => {
            const itemQueryTopics = item.subjectWise?.flatMap(subjectData =>
                subjectData.queries
                    .filter(query => query.topic && query.topic.trim() !== '')
                    .map(query => query.topic.trim())
            ) || [];

            return acc.concat(itemQueryTopics);
        }, []);

        // Remove duplicates and sort by most recent (reverse chronological)
        const uniqueTopics = [...new Set(queryTopics)].filter(topic => topic && topic.trim() !== '');

        console.log(`[getRecentTopics] Found ${uniqueTopics.length} unique topics: ${uniqueTopics.join(', ')}`);
        return { data: uniqueTopics.reverse() }; // Most recent first
    }

    async getTopicChatHistory(userId: string, topic: string) {
        console.log(`[getTopicChatHistory] Fetching history for user: ${userId}, topic: ${topic}`);

        const result = await this.chatHistoryModel.find({ userId: userId }).exec();
        if (!result || result.length === 0) {
            console.log(`[getTopicChatHistory] No chat history found for user: ${userId}`);
            return { data: [] };
        }

        // Build a mapping of subjectId -> subjectName to sanitize any stored IDs in responses/history
        const subjectIdSet = new Set<string>();
        result.forEach(ch => {
            ch.subjectWise?.forEach(sw => {
                if (typeof sw.subject === 'string' && this.looksLikeObjectId(sw.subject)) {
                    subjectIdSet.add(String(sw.subject));
                }
            });
            (ch.subjects || []).forEach((s: any) => {
                if (typeof s === 'string' && this.looksLikeObjectId(s)) {
                    subjectIdSet.add(String(s));
                }
            });
        });
        let subjectMap: Record<string, string> = {};
        if (subjectIdSet.size > 0) {
            const subjectDocs = await this.subjectModel.find({ _id: { $in: Array.from(subjectIdSet) } }).exec();
            subjectDocs.forEach(doc => {
                subjectMap[String(doc._id)] = doc.name;
            });
        }

        // Filter to get ONLY queries that have exact topic match and sanitize subjects/IDs in text
        const topicHistory = result.map(chatHistory => {
            const filteredSubjectWise = chatHistory.subjectWise.map(subjectData => {
                const hasIdSubject = typeof subjectData.subject === 'string' && this.looksLikeObjectId(subjectData.subject);
                const subjectName = hasIdSubject ? (subjectMap[subjectData.subject] || subjectData.subject) : subjectData.subject;
                const sanitizedQueries = subjectData.queries.filter(query => {
                    // STRICT topic matching - only exact matches
                    const hasExactTopicMatch = query.topic && query.topic.trim() === topic.trim();
                    console.log(`[getTopicChatHistory] Query topic: "${query.topic}", Target topic: "${topic}", Match: ${hasExactTopicMatch}`);
                    return hasExactTopicMatch;
                }).map(q => {
                    // Replace any subject ID mentions in response/summary/query with the subject name
                    if (hasIdSubject && subjectMap[subjectData.subject]) {
                        const idRegex = new RegExp(subjectData.subject, 'g');
                        return {
                            ...q,
                            response: typeof q.response === 'string' ? q.response.replace(idRegex, subjectName as string) : q.response,
                            summary: typeof q.summary === 'string' ? q.summary.replace(idRegex, subjectName as string) : q.summary,
                            query: typeof q.query === 'string' ? q.query.replace(idRegex, subjectName as string) : q.query,
                        };
                    }
                    return q;
                });

                return {
                    ...subjectData,
                    subject: subjectName,
                    queries: sanitizedQueries,
                };
            }).filter(subjectData => subjectData.queries.length > 0);

            return {
                ...chatHistory.toObject(),
                subjectWise: filteredSubjectWise
            };
        }).filter(chatHistory => chatHistory.subjectWise.length > 0);

        console.log(`[getTopicChatHistory] Found ${topicHistory.length} days with topic "${topic}" conversations`);
        return { data: topicHistory };
    }

    private isTopicRelated(text: string, topic: string): boolean {
        // Simple topic matching logic - can be enhanced
        const textWords = text.toLowerCase().split(/\s+/);
        const topicWords = topic.toLowerCase().split(/\s+/);

        // Check if any topic words appear in the text
        return topicWords.some(topicWord =>
            textWords.some(textWord =>
                textWord.includes(topicWord) || topicWord.includes(textWord)
            )
        );
    }

    async extractTopicsFromHistory(userId: string) {
        const result = await this.chatHistoryModel.find({ userId: userId }).exec();
        if (result) {
            const potentialTopics = new Set<string>();

            result.forEach(chatHistory => {
                chatHistory.subjectWise?.forEach(subjectData => {
                    subjectData.queries.forEach(query => {
                        // Only extract from queries that don't already have explicit topics
                        if (query.topic && query.topic.trim() !== '') {
                            // Skip extraction for queries that already have explicit topics
                            return;
                        }

                        // Extract topics from query content and responses for old data only
                        const queryContent = query.query.toLowerCase();
                        const responseContent = query.response.toLowerCase();
                        const summaryContent = query.summary ? query.summary.toLowerCase() : '';

                        // Only extract if this looks like a main topic question, not sub-concepts
                        if (queryContent.includes('what is addition') && !queryContent.includes('subtraction')) {
                            potentialTopics.add('Addition');
                        }
                        if (queryContent.includes('what is subtraction') && !queryContent.includes('addition')) {
                            potentialTopics.add('Subtraction');
                        }
                        if (queryContent.includes('what is multiplication')) {
                            potentialTopics.add('Multiplication');
                        }
                        if (queryContent.includes('what is division')) {
                            potentialTopics.add('Division');
                        }
                        if (queryContent.includes('what is algebra') || (queryContent.includes('algebra') && !queryContent.includes('addition') && !queryContent.includes('subtraction'))) {
                            potentialTopics.add('Algebra');
                        }
                        if (queryContent.includes('what is geometry') || (queryContent.includes('geometry') && queryContent.includes('what is'))) {
                            potentialTopics.add('Geometry');
                        }

                        // Science topics - only for direct questions
                        if (queryContent.includes('speed of light') || queryContent.includes('what is speed')) {
                            potentialTopics.add('Physics - Speed and Light');
                        }
                        if (queryContent.includes('explain') && queryContent.includes('physics') && !queryContent.includes('addition')) {
                            potentialTopics.add('Physics Concepts');
                        }

                        // Quiz questions - only if it's the main focus
                        if (queryContent.includes('quiz questions') || (queryContent.includes('quiz') && queryContent.includes('give me'))) {
                            potentialTopics.add('Quiz Questions');
                        }
                    });
                });
            });

            return { data: Array.from(potentialTopics) };
        } else {
            return { data: [] };
        }
    }

    async debugTopics(userId: string) {
        try {
            const result = await this.chatHistoryModel.find({ userId: userId }).exec();

            const debugData = result.map(item => ({
                date: item.date,
                topics: item.topics,
                subjectWise: item.subjectWise.map(sw => ({
                    subject: sw.subject,
                    queries: sw.queries.map(q => ({
                        query: q.query.substring(0, 50) + '...',
                        topic: q.topic,
                        hasTopicField: q.hasOwnProperty('topic')
                    }))
                }))
            }));

            return {
                message: 'Debug data retrieved',
                data: debugData,
                totalDocuments: result.length
            };
        } catch (error) {
            console.error('Error getting debug data:', error);
            return { message: 'Error getting debug data', error: error.message };
        }
    }
}