import { ConflictException, Injectable, UnauthorizedException, NotFoundException   } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { RegisterDto } from 'src/dtos/register.dto';
import { LoginDto } from 'src/dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { decryptData, encryptData, encryptkeyString } from 'src/utils/encrypt_decrypt';
import { promisify } from 'util';
import { scrypt } from 'crypto';

@Injectable()
export class AuthService {

    constructor(
      @InjectModel(User.name) private userModel: Model<User>,
      private jwtService: JwtService,
  ) {}


    async login(loginDto: LoginDto) {
      const { email, password } = loginDto;
      const user = await this.userModel.findOne({ email });
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isPasswordValid = (decryptData(user.password).toString() == password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const payload = { email: user.email, sub: user._id, role: user.role };
      const token = await this.jwtService.signAsync(payload);

      if (user.userDetails != null) {
        return { accessToken: token, isUserDetailsPresent: true };
      }
  
      return { accessToken: token, isUserDetailsPresent: false };
    }
    
    async register(registerDto: RegisterDto) {
        const { email, password } = registerDto;
    
        // Check if the user already exists
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
          throw new ConflictException('User already exists');
        }

        const encryptedMessage = encryptData(password)
        
        // Create a new user
        const newUser = new this.userModel({ email, password: encryptedMessage, role: 'student' });
        if (await newUser.save()) {
          return {success: true};
        } else {
          return {success: false};
        }
        
      }

      
}
