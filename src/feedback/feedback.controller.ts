import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { AdminGuard } from 'src/guard/admin.guard';
import { CreateFeedbackDto, UpdateFeedbackStatusDto, FeedbackFilterDto } from 'src/dtos/feedback.dto';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // User endpoints
  @UseGuards(JwtAuthGuard)
  @Post()
  async createFeedback(@Req() req, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(req.userID, createFeedbackDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-feedbacks')
  async getUserFeedbacks(@Req() req) {
    return this.feedbackService.getUserFeedbacks(req.userID);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-feedbacks/:id')
  async getUserFeedbackById(@Req() req, @Param('id') id: string) {
    return this.feedbackService.getUserFeedbackById(req.userID, id);
  }

  // Admin endpoints
  @UseGuards(AdminGuard)
  @Get('admin')
  async getAllFeedbacks(@Query() filterDto: FeedbackFilterDto) {
    return this.feedbackService.getAllFeedbacks(filterDto);
  }

  @UseGuards(AdminGuard)
  @Get('admin/:id')
  async getFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @UseGuards(AdminGuard)
  @Put('admin/:id')
  async updateFeedbackStatus(
    @Param('id') id: string,
    @Body() updateFeedbackStatusDto: UpdateFeedbackStatusDto
  ) {
    return this.feedbackService.updateFeedbackStatus(id, updateFeedbackStatusDto);
  }

  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  async deleteFeedback(@Param('id') id: string) {
    return this.feedbackService.deleteFeedback(id);
  }
}