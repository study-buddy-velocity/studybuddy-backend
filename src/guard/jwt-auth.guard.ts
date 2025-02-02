import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public
    const request = context.switchToHttp().getRequest();
    const publicRoutes = ['/auth/login'];

  if (publicRoutes.includes(request.url)) {
    return true; // Skip guard for specific routes
  }

    const authHeader = request.headers.authorization;
  

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token not provided or invalid');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = this.jwtService.verify(token, { secret: process.env.JWT_PRIVATE_KEY }); // Replace 'yourSecretKey' with your actual secret key
      request['userID'] = decodedToken['sub']; // Attach the user payload to the request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
