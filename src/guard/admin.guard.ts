import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('Authorization token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_PRIVATE_KEY });

      // //console.log('Admin Guard - Token payload:', payload); // Debug log

      if (payload.role !== 'admin') {
        // //console.log(`Admin Guard - Access denied. User role: ${payload.role}, Required: admin`); // Debug log
        throw new ForbiddenException(`Access restricted to admin users. Current role: ${payload.role || 'none'}`);
      }

      // //console.log('Admin Guard - Access granted for admin user'); // Debug log
      return true;
    } catch (error) {
      // //console.log('Admin Guard - Token verification failed:', error.message); // Debug log
      if (error.name === 'JsonWebTokenError') {
        throw new ForbiddenException('Invalid token format');
      } else if (error.name === 'TokenExpiredError') {
        throw new ForbiddenException('Token has expired');
      } else if (error instanceof ForbiddenException) {
        throw error; // Re-throw our custom forbidden exceptions
      } else {
        throw new ForbiddenException('Token verification failed');
      }
    }
  }
}
