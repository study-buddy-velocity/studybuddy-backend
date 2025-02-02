import { Controller, Get, Query, BadRequestException, Req, UseGuards, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from '../dtos/chatQueryDto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';


@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getEducationalChat(@Req() req, @Query() query: ChatQueryDto): Promise<{ response: string }> {
        const queryDto = plainToInstance(ChatQueryDto, query);
        const errors = await validate(queryDto);

        if (errors.length > 0) {
        throw new BadRequestException('Invalid query parameters');
        }

        const { subject, query: userQuery } = queryDto;
        const response = await this.chatService.getChatResponse(req["userID"], subject, userQuery);
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
