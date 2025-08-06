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
      ////console.log('Login attempt for email:', email);

      const user = await this.userModel.findOne({ email });

      if (!user) {
       // //console.log('User not found for email:', email);
        throw new UnauthorizedException('Invalid credentials');
      }

      //console.log('User found:', { email: user.email, role: user.role });
      //console.log('Encrypted password from DB:', user.password);

      const decryptedPassword = decryptData(user.password).toString();
      // //console.log('Decrypted password:', decryptedPassword);
      // //console.log('Provided password:', password);
      // //console.log('Decrypted password length:', decryptedPassword.length);
      // //console.log('Provided password length:', password.length);
      // //console.log('Decrypted password bytes:', Buffer.from(decryptedPassword, 'utf8'));
      // //console.log('Provided password bytes:', Buffer.from(password, 'utf8'));
      // //console.log('Password match (===):', decryptedPassword === password);
      // //console.log('Password match (trim):', decryptedPassword.trim() === password.trim());

      // Try multiple comparison methods
      const exactMatch = decryptedPassword === password;
      const trimMatch = decryptedPassword.trim() === password.trim();
      const bufferMatch = Buffer.from(decryptedPassword, 'utf8').equals(Buffer.from(password, 'utf8'));
      const normalizedMatch = decryptedPassword.normalize() === password.normalize();

      // //console.log('Exact match:', exactMatch);
      // //console.log('Trim match:', trimMatch);
      // //console.log('Buffer match:', bufferMatch);
      // //console.log('Normalized match:', normalizedMatch);

      const isPasswordValid = exactMatch || trimMatch || bufferMatch || normalizedMatch;
      if (!isPasswordValid) {
        ////console.log('Password validation failed');
        throw new UnauthorizedException('Invalid credentials');
      }

      ////console.log('Login successful for user:', email);
  
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
