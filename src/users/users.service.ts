import {Injectable, NotFoundException, NotAcceptableException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { UserDto } from 'src/dtos/user.dto';
import { CreateUserDetailsDto } from 'src/dtos/createUserDetailsDto';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { Subject } from 'src/schemas/subject.schema';
import { encryptData, encryptkeyString } from 'src/utils/encrypt_decrypt';
import { QuizAttempt } from 'src/schemas/quiz-attempt.schema';
import { Quiz } from 'src/schemas/quiz.schema';

@Injectable()
export class UsersService {

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(UserDetails.name) private userDetailsModel: Model<UserDetails>,
        @InjectModel(Subject.name) private subjectModel: Model<Subject>,
        @InjectModel(QuizAttempt.name) private quizAttemptModel: Model<QuizAttempt>,
        @InjectModel(Quiz.name) private quizModel: Model<Quiz>
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

  // Helper function to map class names to class IDs
  private getClassIdFromClassName(className: string): string | null {
    const classMapping: { [key: string]: string } = {
      '6th Standard': '6th',
      '7th Standard': '7th',
      '8th Standard': '8th',
      '9th Standard': '9th',
      '10th Standard': '10th',
      '11th Standard': '11th',
      '12th Standard': '12th'
    };
    return classMapping[className] || null;
  }

  // Get subjects filtered by user's class
  async getSubjectsForUser(userId: string): Promise<Subject[]> {
    try {
      // Get user's class
      const userDetails = await this.getUserDetailsByUserId(userId);
      const userClass = (userDetails as any).class;
      const userClassId = userClass ? this.getClassIdFromClassName(userClass) : null;

      // Get all subjects
      const subjects = await this.subjectModel.find().exec();

      // Filter topics by user's class
      if (userClassId) {
        return subjects.map(subject => ({
          ...subject.toObject(),
          topics: subject.topics.filter(topic =>
            !topic.classId || topic.classId === userClassId
          )
        })) as Subject[];
      }

      return subjects;
    } catch (error) {
      console.error('Error getting subjects for user:', error);
      // Fallback to all subjects if there's an error
      return this.subjectModel.find().exec();
    }
  }

  // Get a single subject by ID filtered by user's class
  async getSubjectByIdForUser(userId: string, subjectId: string): Promise<Subject> {
    // Get user's class
    const userDetails = await this.getUserDetailsByUserId(userId);
    const userClass = (userDetails as any).class;
    const userClassId = userClass ? this.getClassIdFromClassName(userClass) : null;

    // Fetch subject
    const subject = await this.subjectModel.findById(subjectId).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }

    if (!userClassId) {
      return subject;
    }

    // Filter topics by user's class (allow topics with no classId for backward compatibility)
    const filtered = {
      ...subject.toObject(),
      topics: subject.topics.filter(topic => !topic.classId || topic.classId === userClassId)
    } as unknown as Subject;

    return filtered;
  }

  // Save a quiz attempt for analytics
  async saveQuizAttempt(userId: string, payload: {
    subjectId: string;
    topicId: string;
    answers: Array<{ quizId: string; selectedAnswer: number; timeSpent?: number }>;
    totalTimeSpent?: number;
  }) {
    // Fetch quizzes to verify answers
    const quizIds = payload.answers.map(a => a.quizId);
    const quizzes = await this.quizModel.find({ _id: { $in: quizIds } }).exec();
    const quizMap = new Map(quizzes.map(q => [q._id.toString(), q]));

    let correctAnswers = 0;
    for (const ans of payload.answers) {
      const quiz = quizMap.get(ans.quizId);
      if (!quiz) continue;
      const correctIndex = quiz.options.findIndex(o => (o as any).isCorrect === true);
      if (correctIndex === ans.selectedAnswer) correctAnswers++;
    }

    const totalQuestions = payload.answers.length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const totalTimeSpent = payload.totalTimeSpent ?? payload.answers.reduce((s, a) => s + (a.timeSpent || 0), 0);

    const attempt = new this.quizAttemptModel({
      userId,
      subjectId: payload.subjectId,
      topicId: payload.topicId,
      answers: payload.answers.map(a => ({
        quizId: a.quizId as any,
        selectedAnswer: a.selectedAnswer,
        isCorrect: (() => {
          const quiz = quizMap.get(a.quizId);
          if (!quiz) return false;
          const correctIndex = quiz.options.findIndex(o => (o as any).isCorrect === true);
          return correctIndex === a.selectedAnswer;
        })(),
        timeSpent: a.timeSpent || 0,
      })),
      totalQuestions,
      correctAnswers,
      score,
      totalTimeSpent,
      status: 'completed'
    });

    await attempt.save();
    return { success: true };
  }

}
