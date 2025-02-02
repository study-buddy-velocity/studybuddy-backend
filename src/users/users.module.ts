import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from 'src/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwtConfig';
import { UserDetailsSchema, UserDetails } from 'src/schemas/userDetails.schema';

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: UserDetails.name, schema: UserDetailsSchema }])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, JwtModule]
})
export class UsersModule {}
