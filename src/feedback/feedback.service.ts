import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackStatus } from 'src/schemas/feedback.schema';
import { CreateFeedbackDto, UpdateFeedbackStatusDto, FeedbackFilterDto } from 'src/dtos/feedback.dto';
import { UsersService } from 'src/users/users.service';


@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
    private readonly usersService: UsersService
  ) {}

  // User methods
  async createFeedback(userId: string, createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const userDetails = await this.usersService.getUserDetailsByUserId(userId);
    ////console.log('userDetails:', userDetails);
    ////console.log('typeof userDetails:', typeof userDetails);
    
    if (!userDetails) {
      throw new NotFoundException('User not found');
    }

    // Just use the string as the userName or default to 'Anonymous User'
    const userName = typeof userDetails === 'string' ? userDetails : 'Anonymous User';
    
    const newFeedback = new this.feedbackModel({
      ...createFeedbackDto,
      userId,
      userName,
      status: createFeedbackDto.priority ? FeedbackStatus.OPEN : FeedbackStatus.PENDING,
      priority: createFeedbackDto.priority || 'medium',
      category: createFeedbackDto.category || 'General',
      subject: createFeedbackDto.subject || null,
      attachments: createFeedbackDto.attachments || []
    });
    
    return newFeedback.save();
  }

  async getUserFeedbacks(userId: string): Promise<Feedback[]> {
    return this.feedbackModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getUserFeedbackById(userId: string, feedbackId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(feedbackId).exec();
    
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }
    
    if (feedback.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to access this feedback');
    }
    
    return feedback;
  }

  // Admin methods
  async getAllFeedbacks(filterDto: FeedbackFilterDto): Promise<Feedback[]> {
    const filter: any = {};
    
    if (filterDto.status) {
      filter.status = filterDto.status;
    }
    
    if (filterDto.userId) {
      filter.userId = filterDto.userId;
    }
    
    return this.feedbackModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getFeedbackById(feedbackId: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(feedbackId).exec();
    
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }
    
    return feedback;
  }

  async updateFeedbackStatus(
    feedbackId: string, 
    updateFeedbackStatusDto: UpdateFeedbackStatusDto
  ): Promise<Feedback> {
    const updatedFeedback = await this.feedbackModel.findByIdAndUpdate(
      feedbackId,
      updateFeedbackStatusDto,
      { new: true }
    ).exec();
    
    if (!updatedFeedback) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }
    
    return updatedFeedback;
  }

  async deleteFeedback(feedbackId: string): Promise<{ success: boolean }> {
    const result = await this.feedbackModel.findByIdAndDelete(feedbackId).exec();
    
    if (!result) {
      throw new NotFoundException(`Feedback with ID ${feedbackId} not found`);
    }
    
    return { success: true };
  }
}









