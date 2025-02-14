import {Injectable, NotFoundException, NotAcceptableException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { UserDto } from 'src/dtos/user.dto';
import { CreateUserDetailsDto } from 'src/dtos/createUserDetailsDto';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { encryptData, encryptkeyString } from 'src/utils/encrypt_decrypt';

@Injectable()
export class UsersService {

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(UserDetails.name) private userDetailsModel: Model<UserDetails>
    ) {}

    async getAllUsers(): Promise<User[]> {
        return this.userModel.find().exec();
      }

      async updateUser(id: string, updateData: UserDto): Promise<User> {
        // Encrypt the password
        const encryptPassword = encryptData(updateData.password);
        updateData.password = encryptPassword.toString();
        const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, {
          new: true,
        }).exec();
    
        if (!updatedUser) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
    
        return updatedUser;
      }

      async deleteUser(id: string) {
        const user = this.userModel.findOne({_id: id}).exec();
        if ((await user).userDetails != null) {
          const userDetailsID = (await user).userDetails._id
          if (await this.userDetailsModel.findByIdAndDelete(userDetailsID).exec()) {
            if (await this.userModel.findByIdAndDelete(id).exec()) {
              return { success: true }
            } else {
              throw new NotFoundException(`User with ID ${id} not found`);
            }
          } else {
            throw new NotFoundException(`User Details with ID ${id} not found`);
          }
        } else {
          const result = await this.userModel.findByIdAndDelete(id).exec();
          if (!result) {
            throw new NotFoundException(`User with ID ${id} not found`);
          } else {
              return { success: true }
          }
        }
      }

      async findUserByID(id: string): Promise<User> {
        // Check if the User exists
        const userExists = await this.userModel.findById( { _id: id});
          if (!userExists) {
          throw new NotFoundException(`User with id ${id} not found`);
        }
        return userExists
      }

      async createUserDetails(userId: string, createUserDetailsDto: CreateUserDetailsDto) {
        // Check if the User exists
        const user = await this.userModel.findById(userId);
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (user.userDetails == null) {
          // Create UserDetails
          const userDetails = new this.userDetailsModel({ ...createUserDetailsDto, user: userId });
          const savedUserDetails = await userDetails.save();

          // Attach UserDetails to User
          user.userDetails = savedUserDetails._id;
          await user.save();

          return savedUserDetails;
        } else {
          throw new NotAcceptableException(`User details already exists with id ${userId} not found`);
        }
        
    }

    async getUserDetailsByUserId(userId: string) {
      // Step 1: Find the user by ID and populate the userDetails field
      const user = await this.userModel
        .findById(userId) // Populate the userDetails reference
        .populate('userDetails')
        .exec();
        
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      // Step 2: Return the populated UserDetails
      if (!user.userDetails) {
        throw new NotFoundException(`UserDetails for user with ID ${userId} not found`);
      }
      
      return user.userDetails.toJSON(); // Return the UserDetails
    }

     // Fetch User and update UserDetails
  async updateUserDetails(userId: string, updateDto: CreateUserDetailsDto): Promise<UserDetails> {
    // Find the User document by ID
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.userDetails) {
      throw new NotFoundException(`UserDetails not found for user with ID ${userId}`);
    }

    // Find the UserDetails document using the userDetails ObjectId in the User model
    const userDetails = await this.userDetailsModel
      .findById(user.userDetails)
      .exec();

    if (!userDetails) {
      throw new NotFoundException(`UserDetails not found for user with ID ${userId}`);
    }

    // Update UserDetails fields
    Object.assign(userDetails, updateDto); // Update the fields based on the DTO

    // Save the updated UserDetails document
    await userDetails.save();

    return userDetails;
  }
}
