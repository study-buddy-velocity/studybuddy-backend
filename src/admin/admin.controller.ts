import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/guard/admin.guard';
import { SubjectDto, UpdateSubjectDto, AddTopicDto, UpdateTopicDto } from 'src/dtos/subject.dto';
import { CreateQuizDto, UpdateQuizDto, QuizFilterDto, BulkCreateQuizDto } from 'src/dtos/quiz.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Subject endpoints
  @Get('subjects')
  async getAllSubjects() {
    return this.adminService.getAllSubjects();
  }

  @Get('subjects/:id')
  async getSubjectById(@Param('id') id: string) {
    return this.adminService.getSubjectById(id);
  }

  @Post('subjects')
  async createSubject(@Body() subjectDto: SubjectDto) {
    return this.adminService.createSubject(subjectDto);
  }

  @Put('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.adminService.updateSubject(id, updateSubjectDto);
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    return this.adminService.deleteSubject(id);
  }

  // Topic endpoints
  @Post('subjects/:subjectId/topics')
  async addTopicForSubject(
    @Param('subjectId') subjectId: string,
    @Body() topic: { name: string; description?: string; classId?: string }
  ) {
    const addTopicDto = { subjectId, topic };
    return this.adminService.addTopic(addTopicDto);
  }

  // (Optional: keep legacy endpoint for backward compatibility)
  @Post('topics')
  async addTopic(@Body() addTopicDto: AddTopicDto) {
    return this.adminService.addTopic(addTopicDto);
  }

  @Put('topics')
  async updateTopic(@Body() updateTopicDto: UpdateTopicDto) {
    return this.adminService.updateTopic(updateTopicDto);
  }

  @Delete('topics')
  async deleteTopic(
    @Query('subjectId') subjectId: string,
    @Query('topicId') topicId: string,
  ) {
    return this.adminService.deleteTopic(subjectId, topicId);
  }

  // Quiz endpoints
  @Post('quizzes')
  async createQuiz(@Body() createQuizDto: CreateQuizDto) {
    return this.adminService.createQuiz(createQuizDto);
  }

  @Post('quizzes/bulk')
  async createBulkQuizzes(@Body() bulkCreateQuizDto: BulkCreateQuizDto) {
    return this.adminService.createBulkQuizzes(bulkCreateQuizDto);
  }

  @Get('quizzes')
  async getAllQuizzes(@Query() filterDto: QuizFilterDto) {
    return this.adminService.getAllQuizzes(filterDto);
  }

  @Get('quizzes/:id')
  async getQuizById(@Param('id') id: string) {
    return this.adminService.getQuizById(id);
  }

  @Put('quizzes/:id')
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return this.adminService.updateQuiz(id, updateQuizDto);
  }

  @Delete('quizzes/:id')
  async deleteQuiz(@Param('id') id: string) {
    return this.adminService.deleteQuiz(id);
  }
}
