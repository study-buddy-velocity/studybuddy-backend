import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { AdminGuard } from 'src/guard/admin.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';

@Controller('admin-debug')
export class AdminDebugController {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('token-info')
  async getTokenInfo(@Req() req) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    try {
      const payload = this.jwtService.verify(token);
      return {
        success: true,
        payload,
        userID: req['userID'],
        hasRole: !!payload.role,
        role: payload.role,
        isAdmin: payload.role === 'admin'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        token: token ? 'Token present' : 'No token'
      };
    }
  }

  @UseGuards(AdminGuard)
  @Get('admin-test')
  async testAdminAccess() {
    return {
      success: true,
      message: 'Admin access working correctly',
      timestamp: new Date().toISOString()
    };
  }

  @Get('no-auth-test')
  async testNoAuth() {
    return {
      success: true,
      message: 'No auth endpoint working',
      timestamp: new Date().toISOString()
    };
  }

  @Get('users-info')
  async getUsersInfo() {
    try {
      const users = await this.userModel.find({}, { email: 1, role: 1, _id: 1 }).exec();
      const adminUsers = users.filter(user => user.role === 'admin');
      const studentUsers = users.filter(user => user.role === 'student' || !user.role);

      return {
        success: true,
        totalUsers: users.length,
        adminUsers: adminUsers.length,
        studentUsers: studentUsers.length,
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          role: user.role || 'student'
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
