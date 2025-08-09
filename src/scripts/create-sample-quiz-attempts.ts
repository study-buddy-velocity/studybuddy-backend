import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { QuizAttempt } from '../schemas/quiz-attempt.schema';
import { User } from '../schemas/user.schema';
import { Subject } from '../schemas/subject.schema';

async function createSampleQuizAttempts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const quizAttemptModel = app.get<Model<QuizAttempt>>(getModelToken(QuizAttempt.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const subjectModel = app.get<Model<Subject>>(getModelToken(Subject.name));

  try {
    // Get a sample user (you can replace this with a specific user ID)
    const users = await userModel.find({ role: 'student' }).limit(5).exec();
    const subjects = await subjectModel.find().exec();

    if (users.length === 0 || subjects.length === 0) {
      console.log('No users or subjects found. Please create some first.');
      return;
    }

    console.log(`Found ${users.length} users and ${subjects.length} subjects`);

    // Create sample quiz attempts for each user
    for (const user of users) {
      console.log(`Creating quiz attempts for user: ${user.email}`);
      
      // Create 3-5 quiz attempts per user across different subjects
      const numAttempts = Math.floor(Math.random() * 3) + 3; // 3-5 attempts
      
      for (let i = 0; i < numAttempts; i++) {
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

        // Skip if subject has no topics
        if (!randomSubject.topics || randomSubject.topics.length === 0) {
          console.log(`  Skipping ${randomSubject.name} - no topics available`);
          continue;
        }

        const randomTopic = randomSubject.topics[Math.floor(Math.random() * randomSubject.topics.length)];
        
        // Generate realistic quiz performance
        const totalQuestions = Math.floor(Math.random() * 5) + 5; // 5-10 questions
        const correctAnswers = Math.floor(Math.random() * totalQuestions * 0.4) + Math.floor(totalQuestions * 0.4); // 40-80% correct
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const totalTimeSpent = Math.floor(Math.random() * 300) + 180; // 3-8 minutes
        
        // Create sample answers
        const answers = [];
        for (let q = 0; q < totalQuestions; q++) {
          answers.push({
            quizId: randomSubject._id, // Using subject ID as placeholder
            selectedAnswer: Math.floor(Math.random() * 4), // 0-3 for multiple choice
            isCorrect: q < correctAnswers,
            timeSpent: Math.floor(Math.random() * 60) + 15 // 15-75 seconds per question
          });
        }

        const quizAttempt = new quizAttemptModel({
          userId: user._id,
          subjectId: randomSubject._id,
          topicId: randomTopic._id,
          answers: answers,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          score: score,
          totalTimeSpent: totalTimeSpent,
          status: 'completed'
        });

        await quizAttempt.save();
        console.log(`  Created quiz attempt: ${randomSubject.name} - ${score}% (${correctAnswers}/${totalQuestions})`);
      }
    }

    console.log('Sample quiz attempts created successfully!');
    
  } catch (error) {
    console.error('Error creating sample quiz attempts:', error);
  } finally {
    await app.close();
  }
}

// Run the script
createSampleQuizAttempts();
