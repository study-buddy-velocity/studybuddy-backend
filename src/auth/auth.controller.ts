import { Controller, Post, Body, UseGuards, Get, Put, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/dtos/register.dto';
import { LoginDto } from 'src/dtos/login.dto';
import { AdminGuard } from 'src/guard/admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password to receive JWT token'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT access token'
        },
        user: {
          type: 'object',
          description: 'User information'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials'
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AdminGuard)
  @Post('register')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Register new user (Admin only)',
    description: 'Create a new user account. Requires admin privileges.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required'
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

}
