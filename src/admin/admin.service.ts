import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from 'src/schemas/subject.schema';
import { Quiz } from 'src/schemas/quiz.schema';
import { SubjectDto, UpdateSubjectDto, AddTopicDto, UpdateTopicDto } from 'src/dtos/subject.dto';
import { CreateQuizDto, UpdateQuizDto, QuizFilterDto, BulkCreateQuizDto } from 'src/dtos/quiz.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>
  ) {}

  // Subject CRUD operations
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectModel.find().exec();
  }

  async getSubjectById(id: string): Promise<Subject> {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async createSubject(subjectDto: SubjectDto): Promise<Subject> {
    const existingSubject = await this.subjectModel.findOne({ name: subjectDto.name }).exec();
    if (existingSubject) {
      throw new ConflictException(`Subject with name ${subjectDto.name} already exists`);
    }
    
    const newSubject = new this.subjectModel(subjectDto);
    return newSubject.save();
  }

  async updateSubject(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const updatedSubject = await this.subjectModel.findByIdAndUpdate(
      id, 
      updateSubjectDto, 
      { new: true }
    ).exec();
    
    if (!updatedSubject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    
    return updatedSubject;
  }

  async deleteSubject(id: string): Promise<{ success: boolean }> {
    const result = await this.subjectModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    
    return { success: true };
  }

  // Topic operations
  async addTopic(addTopicDto: AddTopicDto): Promise<Subject> {
    const subject = await this.subjectModel.findById(addTopicDto.subjectId).exec();
    
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${addTopicDto.subjectId} not found`);
    }
    
    // Create a new topic without type issues
    subject.topics.push(addTopicDto.topic as any);
    return subject.save();
  }

  async updateTopic(updateTopicDto: UpdateTopicDto): Promise<Subject> {
    const subject = await this.subjectModel.findById(updateTopicDto.subjectId).exec();
    
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${updateTopicDto.subjectId} not found`);
    }
    
    const topicIndex = subject.topics.findIndex(
      topic => topic._id.toString() === updateTopicDto.topicId
    );
    
    if (topicIndex === -1) {
      throw new NotFoundException(`Topic with ID ${updateTopicDto.topicId} not found`);
    }
    
    // Update topic properties while preserving the _id
    const updatedTopic = {
      ...subject.topics[topicIndex].toObject(),
      name: updateTopicDto.topic.name,
      description: updateTopicDto.topic.description,
      ...(typeof (updateTopicDto as any).topic.classId !== 'undefined' ? { classId: (updateTopicDto as any).topic.classId } : {})
    };
    
    // Replace the topic at the specified index
    subject.topics[topicIndex] = updatedTopic as any;
    
    return subject.save();
  }

  async deleteTopic(subjectId: string, topicId: string): Promise<Subject> {
    const subject = await this.subjectModel.findById(subjectId).exec();
    
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    }
    
    const topicIndex = subject.topics.findIndex(
      topic => topic._id.toString() === topicId
    );
    
    if (topicIndex === -1) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }
    
    subject.topics.splice(topicIndex, 1);
    return subject.save();
  }

  // Quiz operations
  async createQuiz(createQuizDto: CreateQuizDto): Promise<Quiz> {
    // Validate subject exists
    const subject = await this.subjectModel.findById(createQuizDto.subjectId).exec();
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${createQuizDto.subjectId} not found`);
    }

    // Validate topic exists
    const topicExists = subject.topics.some(
      topic => topic._id.toString() === createQuizDto.topicId
    );
    if (!topicExists) {
      throw new NotFoundException(`Topic with ID ${createQuizDto.topicId} not found in subject`);
    }

    // Validate at least one correct answer
    const hasCorrectAnswer = createQuizDto.options.some(option => option.isCorrect);
    if (!hasCorrectAnswer) {
      throw new BadRequestException('Quiz must have at least one correct answer');
    }

    const newQuiz = new this.quizModel(createQuizDto);
    return newQuiz.save();
  }

  async createBulkQuizzes(bulkCreateQuizDto: BulkCreateQuizDto): Promise<{ success: boolean; created: number; errors: string[] }> {
    const results = {
      success: true,
      created: 0,
      errors: []
    };

    for (let i = 0; i < bulkCreateQuizDto.questions.length; i++) {
      const questionDto = bulkCreateQuizDto.questions[i];
      try {
        // Validate subject exists
        const subject = await this.subjectModel.findById(questionDto.subjectId).exec();
        if (!subject) {
          results.errors.push(`Row ${i + 1}: Subject with ID ${questionDto.subjectId} not found`);
          continue;
        }

        // Validate topic exists
        const topicExists = subject.topics.some(
          topic => topic._id.toString() === questionDto.topicId
        );
        if (!topicExists) {
          results.errors.push(`Row ${i + 1}: Topic with ID ${questionDto.topicId} not found in subject`);
          continue;
        }

        // Validate at least one correct answer
        const hasCorrectAnswer = questionDto.options.some(option => option.isCorrect);
        if (!hasCorrectAnswer) {
          results.errors.push(`Row ${i + 1}: Quiz must have at least one correct answer`);
          continue;
        }

        const newQuiz = new this.quizModel(questionDto);
        await newQuiz.save();
        results.created++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    return results;
  }

  async getAllQuizzes(filterDto: QuizFilterDto): Promise<Quiz[]> {
    const filter: any = {};

    if (filterDto.subjectId) {
      filter.subjectId = filterDto.subjectId;
    }

    if (filterDto.topicId) {
      filter.topicId = filterDto.topicId;
    }

    if (filterDto.classId) {
      // Accept quizzes tagged with the requested class ID, or with no/empty class.
      // Also accept entries that used the class name (e.g., '6th Standard') for backward compatibility.
      const classNameFromId: Record<string, string> = {
        '6th': '6th Standard', '7th': '7th Standard', '8th': '8th Standard',
        '9th': '9th Standard', '10th': '10th Standard', '11th': '11th Standard', '12th': '12th Standard'
      };
      const requested = filterDto.classId;
      const legacyName = classNameFromId[requested];

      const allowedValues = [requested, legacyName, null, ''].filter(v => v !== undefined);

      filter.$or = [
        { classId: { $in: allowedValues } },
        { classId: { $exists: false } },
      ];
    }
    
    let query = this.quizModel.find(filter);
    
    // Debug the value to ensure it's being received correctly
    ////console.log('noOfQuestions:', filterDto.noOfQuestions, typeof filterDto.noOfQuestions);
    
    // If noOfQuestions is specified, limit the results
    if (filterDto.noOfQuestions && filterDto.noOfQuestions > 0) {
      query = query.limit(Number(filterDto.noOfQuestions));
    }
    
    return query.exec();
  }

  async getQuizById(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    return quiz;
  }

  async updateQuiz(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
    // Validate options if provided
    if (updateQuizDto.options) {
      const hasCorrectAnswer = updateQuizDto.options.some(option => option.isCorrect);
      if (!hasCorrectAnswer) {
        throw new BadRequestException('Quiz must have at least one correct answer');
      }
    }

    const updatedQuiz = await this.quizModel.findByIdAndUpdate(
      id,
      updateQuizDto,
      { new: true }
    ).exec();

    if (!updatedQuiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return updatedQuiz;
  }

  async deleteQuiz(id: string): Promise<{ success: boolean }> {
    const result = await this.quizModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }
    
    return { success: true };
  }
}



