import { Controller, Body, UseGuards, Get, Put, Delete, Param, HttpCode, HttpStatus, Query, Post, HttpException, Req } from '@nestjs/common';
import { UserDto, QueryIdDto } from 'src/dtos/user.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { UsersService } from './users.service';
import { AdminGuard } from 'src/guard/admin.guard';
import { CreateUserDetailsDto } from 'src/dtos/createUserDetailsDto';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { User } from 'src/schemas/user.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from 'src/admin/admin.service';
import { Subject } from 'src/schemas/subject.schema';
import { QuizFilterDto } from 'src/dtos/quiz.dto';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiBody } from '@nestjs/swagger';

// DTO for quiz attempts
export class CreateQuizAttemptDto {
  @IsString() @IsNotEmpty() subjectId: string;
  @IsString() @IsNotEmpty() topicId: string;
  @IsArray() @IsNotEmpty() answers: Array<{ quizId: string; selectedAnswer: number; timeSpent?: number }>;
  @IsOptional() @IsNumber() totalTimeSpent?: number;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly adminService: AdminService
    ) {}

  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update existing user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Updated user', type: UserDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Put()
  async updateUser(@Query('id') id: string, @Body() updateData: UserDto) {
    if (!id) {
        throw new Error('User ID is required to update a user.');
      }
    return this.usersService.updateUser(id, updateData);
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Delete()
  async deleteUser(@Query('id') id: string) {
    return await this.usersService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or overwrite user profile details' })
  @ApiResponse({ status: 201, description: 'User details created', type: UserDetails })
  @Post('user-details')
  async create(@Req() req, @Body() createUserDetailsDto: CreateUserDetailsDto) {
    try {
      return await this.usersService.createUserDetails(req['userID'], createUserDetailsDto)
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

 // Endpoint to fetch UserDetails by userId
 @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile details' })
  @ApiResponse({ status: 200, description: 'User details', type: UserDetails })
  @Get('user-details')
  async getUserDetails(@Req() req) {
    return this.usersService.getUserDetailsByUserId(req['userID']);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile details' })
  @ApiResponse({ status: 200, description: 'Updated user details', type: UserDetails })
  @Put('user-details')
  async updateUserDetails(@Req() req, @Body() updateDto: CreateUserDetailsDto, user: User): Promise<UserDetails> {
    return this.usersService.updateUserDetails(req['userID'], updateDto);
  }

  // User-accessible subject endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all subjects for users' })
  @ApiResponse({ status: 200, description: 'List of subjects', type: [Subject] })
  @Get('subjects')
  async getAllSubjectsForUsers(@Req() req): Promise<Subject[]> {
    return this.usersService.getSubjectsForUser(req['userID']);
  }

  // User-accessible quiz endpoints
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get quizzes for users' })
  @ApiResponse({ status: 200, description: 'List of quizzes' })
  @Get('quizzes')
  async getAllQuizzesForUsers(@Query() filterDto: QuizFilterDto) {
    return this.adminService.getAllQuizzes(filterDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get subject by ID for users' })
  @ApiResponse({ status: 200, description: 'Subject details', type: Subject })
  @Get('subjects/:id')
  async getSubjectByIdForUsers(@Req() req, @Param('id') id: string): Promise<Subject> {
    return this.usersService.getSubjectByIdForUser(req['userID'], id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save a quiz attempt for analytics' })
  @ApiBody({ description: 'Quiz attempt payload', type: CreateQuizAttemptDto as any })
  @Post('quiz-attempts')
  async saveQuizAttempt(@Req() req, @Body() dto: CreateQuizAttemptDto) {
    return this.usersService.saveQuizAttempt(req['userID'], dto as any);
  }
}
