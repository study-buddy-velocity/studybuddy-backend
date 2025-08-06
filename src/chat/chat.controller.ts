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
        const queryDto = plainToInstance(ChatQueryDto, query);
        const errors = await validate(queryDto);

        if (errors.length > 0) {
        throw new BadRequestException('Invalid query parameters');
        }

        const { subject, query: userQuery, topic } = queryDto;
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
    @Get("chat-streak")
    async getChatStreak(@Req() req) {
        return await this.chatService.getChatStreak(req['userID'])
    }
}
