import { Controller, Get, Query, BadRequestException, Req, UseGuards, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from '../dtos/chatQueryDto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';


@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
      summary: 'Get AI chat response',
      description: 'Send a query to the AI tutor and get an educational response'
    })
    @ApiQuery({
      name: 'subject',
      description: 'The subject for the educational query',
      example: 'Mathematics'
    })
    @ApiQuery({
      name: 'query',
      description: 'The user\'s question or query',
      example: 'Explain quadratic equations'
    })
    @ApiQuery({
      name: 'topic',
      description: 'The topic for the educational query (optional)',
      required: false,
      example: 'Quadratic Equations'
    })
    @ApiResponse({
      status: 200,
      description: 'Chat response received',
      schema: {
        type: 'object',
        properties: {
          response: {
            type: 'string',
            description: 'AI-generated educational response'
          }
        }
      }
    })
    @ApiResponse({ status: 400, description: 'Invalid query parameters' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async getEducationalChat(@Req() req: any, @Query() query: ChatQueryDto): Promise<{ response: string }> {
        // Log raw query to see what we're receiving
        console.log('=== CHAT REQUEST DEBUG ===');
        console.log('Raw query object:', JSON.stringify(query, null, 2));

        const queryDto = plainToInstance(ChatQueryDto, query);
        console.log('After plainToInstance:', JSON.stringify(queryDto, null, 2));

        const errors = await validate(queryDto);

        if (errors.length > 0) {
        throw new BadRequestException('Invalid query parameters');
        }

        const { subject, query: userQuery, topic } = queryDto;
        console.log('Extracted values:', { subject, userQuery: userQuery?.substring(0, 30) + '...', topic });
        console.log('Topic type:', typeof topic, 'Topic value:', topic);

        const response = await this.chatService.getChatResponse(req["userID"], subject, userQuery, topic);
        return { response };
    }

    @UseGuards(JwtAuthGuard)
    @Get("chat-history")
    async getHistoryForDay(@Req() req, @Query('date') date: string) {
        if (date == null) {
            return await this.chatService.getHistoryofLastFive(req['userID'])
        }
        return await this.chatService.getHistoryForDay(req['userID'], date)
    }

    // @UseGuards(JwtAuthGuard)
    // @Get("chat-historys")
    // async getHistoryForFiveDays(@Req() req) {
    //     return await this.chatService.getHistoryofLastFive(req['userID'])
    // }

    @UseGuards(JwtAuthGuard)
    @Get("heat-map")
    async getFilteredChatHistory(@Req() req, @Query('upperBound') upperBound: string, @Query('lowerBound') lowerBound: string ) {
        return await this.chatService.getFilteredChatHistory(req['userID'], lowerBound, upperBound)
    }

    @UseGuards(JwtAuthGuard)
    @Get("recent-topics")
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Get recent topics for user',
        description: 'Retrieve all unique topics the user has discussed'
    })
    @ApiResponse({ status: 200, description: 'Recent topics retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async getRecentTopics(@Req() req) {
        return await this.chatService.getRecentTopics(req['userID']);
    }

    @UseGuards(JwtAuthGuard)
    @Get("topic-history")
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Get chat history for a specific topic',
        description: 'Retrieve chat history filtered by a specific topic'
    })
    @ApiQuery({
        name: 'topic',
        description: 'The topic to filter chat history by',
        example: 'Quadratic Equations'
    })
    @ApiResponse({ status: 200, description: 'Topic chat history retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async getTopicChatHistory(@Req() req, @Query('topic') topic: string) {
        return await this.chatService.getTopicChatHistory(req['userID'], topic);
    }

    @UseGuards(JwtAuthGuard)
    @Get("extract-topics")
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Extract potential topics from existing chat history',
        description: 'Analyze existing chat history to identify potential topics for testing'
    })
    @ApiResponse({ status: 200, description: 'Topics extracted successfully' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async extractTopicsFromHistory(@Req() req) {
        return await this.chatService.extractTopicsFromHistory(req['userID']);
    }

    @UseGuards(JwtAuthGuard)
    @Get("debug-topics")
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Debug topics storage',
        description: 'Show raw chat history data to debug topic storage'
    })
    @ApiResponse({ status: 200, description: 'Debug data retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Authentication required' })
    async debugTopics(@Req() req) {
        return await this.chatService.debugTopics(req['userID']);
    }

    @UseGuards(JwtAuthGuard)
    @Get("chat-streak")
    async getChatStreak(@Req() req) {
        return await this.chatService.getChatStreak(req['userID'])
    }
}
