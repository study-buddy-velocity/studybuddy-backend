import { Controller, Body, UseGuards, Get, Put, Delete, Param, HttpCode, HttpStatus, Query, Post, HttpException, Req } from '@nestjs/common';
import { UserDto, QueryIdDto } from 'src/dtos/user.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { UsersService } from './users.service';
import { AdminGuard } from 'src/guard/admin.guard';
import { CreateUserDetailsDto } from 'src/dtos/createUserDetailsDto';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { User } from 'src/schemas/user.schema';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

@UseGuards(AdminGuard)
  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(AdminGuard)
  @Put()
  async updateUser(@Query('id') id: string, @Body() updateData: UserDto) {
    if (!id) {
        throw new Error('User ID is required to update a user.');
      }
    return this.usersService.updateUser(id, updateData);
  }

  @UseGuards(AdminGuard)
  @Delete()
  async deleteUser(@Query('id') id: string) {
    return await this.usersService.deleteUser(id);
  }

  @UseGuards(JwtAuthGuard)
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
  @Get('user-details')
  async getUserDetails(@Req() req) {
    return this.usersService.getUserDetailsByUserId(req['userID']);
  }

  @UseGuards(JwtAuthGuard)
  @Put('user-details')
  async updateUserDetails(@Req() req, @Body() updateDto: CreateUserDetailsDto, user: User): Promise<UserDetails> {
    return this.usersService.updateUserDetails(req['userID'], updateDto);
  }
}
