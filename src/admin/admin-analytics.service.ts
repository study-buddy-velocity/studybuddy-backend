import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { ChatHistory } from 'src/schemas/chatHistory.schema';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserDetails.name) private userDetailsModel: Model<UserDetails>,
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistory>,
  ) {}

  async getStudentAnalytics(userId: string) {
    try {
      // Get user basic info
      const user = await this.userModel.findById(userId).populate('userDetails').exec();
      if (!user) {
        throw new NotFoundException('Student not found');
      }

      // Get user details
      const userDetails = user.userDetails as any;

      // Get chat history for analytics
      const chatHistory = await this.chatHistoryModel.find({ userId }).exec();

      // Calculate chat statistics
      const chatStats = this.calculateChatStats(chatHistory);

      // Calculate quiz statistics (mock for now - you can implement actual quiz tracking)
      const quizStats = await this.calculateQuizStats(userId, chatHistory);

      // Get leaderboard position (using existing leaderboard logic)
      const leaderboardStats = await this.calculateLeaderboardStats(userId, chatHistory);

      // Calculate activity patterns
      const activityPattern = this.calculateActivityPattern(chatHistory);

      // Access createdAt safely using bracket notation
      const createdAt = (user as any).createdAt || new Date();

      return {
        studentInfo: {
          userId: user._id,
          email: user.email,
          name: userDetails?.name || 'N/A',
          phone: userDetails?.phoneno || 'N/A',
          class: userDetails?.class || 'N/A',
          schoolName: userDetails?.schoolName || 'N/A',
          profileImage: userDetails?.profileImage || null,
          createdAt: createdAt,
          subjects: userDetails?.subjects || []
        },
        analytics: {
          quizStats,
          chatStats,
          leaderboardStats,
          activityPattern
        }
      };
    } catch (error) {
      console.error('Error getting student analytics:', error);
      throw error;
    }
  }

  private calculateChatStats(chatHistory: any[]) {
    const totalMessages = chatHistory.reduce((sum, day) => {
      return sum + (day.subjectWise?.reduce((daySum: number, subject: any) => {
        return daySum + (subject.queries?.length || 0);
      }, 0) || 0);
    }, 0);

    const totalTokens = chatHistory.reduce((sum, day) => sum + (day.totalTokensSpent || 0), 0);

    // Calculate most discussed subject
    const subjectCounts: { [key: string]: number } = {};
    chatHistory.forEach(day => {
      day.subjects?.forEach((subject: string) => {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      });
    });

    const mostDiscussedSubject = Object.keys(subjectCounts).reduce((a, b) => 
      subjectCounts[a] > subjectCounts[b] ? a : b, 'N/A'
    );

    // Calculate time spent (rough estimate based on tokens)
    const totalTimeMinutes = Math.floor(totalTokens / 10); // Rough estimate: 10 tokens per minute
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = totalTimeMinutes % 60;
    const totalTimeSpent = `${hours}hr ${minutes}min`;

    // Calculate streak (consecutive days with activity)
    const streak = this.calculateStreak(chatHistory);

    // Find most active time (mock implementation)
    const timeOfDayMostActive = this.findMostActiveTime(chatHistory);

    return {
      totalMessages,
      totalDoubts: totalMessages, // Assuming all messages are doubts for now
      mostDiscussedSubject,
      totalTimeSpent,
      timeOfDayMostActive,
      streak
    };
  }

  private async calculateQuizStats(userId: string, chatHistory: any[]) {
    // Mock quiz statistics - you can implement actual quiz tracking
    const subjectWiseAttempts = {
      'Mathematics': Math.floor(Math.random() * 10) + 1,
      'Physics': Math.floor(Math.random() * 8) + 1,
      'Chemistry': Math.floor(Math.random() * 6) + 1,
      'Biology': Math.floor(Math.random() * 5) + 1
    };

    const totalAttempted = Object.values(subjectWiseAttempts).reduce((sum, count) => sum + count, 0);
    
    const averageScores = {
      'Mathematics': Math.random() * 0.4 + 0.6, // 60-100%
      'Physics': Math.random() * 0.4 + 0.6,
      'Chemistry': Math.random() * 0.4 + 0.6,
      'Biology': Math.random() * 0.4 + 0.6
    };

    const accuracy = Object.values(averageScores).reduce((sum, score) => sum + score, 0) / Object.keys(averageScores).length * 100;

    const lastQuizDate = chatHistory.length > 0 ? 
      new Date(chatHistory[chatHistory.length - 1].createdAt).toLocaleDateString() : 'N/A';

    return {
      totalAttempted,
      accuracy: Math.round(accuracy),
      subjectWiseAttempts,
      averageScores,
      lastQuizDate,
      topicsCompleted: Math.floor(totalAttempted * 0.8) // Estimate
    };
  }

  private async calculateLeaderboardStats(userId: string, chatHistory: any[]) {
    const totalTokens = chatHistory.reduce((sum, day) => sum + (day.totalTokensSpent || 0), 0);
    const totalQueries = chatHistory.reduce((sum, day) => {
      return sum + (day.subjectWise?.reduce((daySum: number, subject: any) => {
        return daySum + (subject.queries?.length || 0);
      }, 0) || 0);
    }, 0);

    const streak = this.calculateStreak(chatHistory);
    
    // Calculate spark points using similar logic to leaderboard service
    const sparkPoints = Math.floor(
      (totalTokens / 100 + totalQueries * 5) * Math.min(1 + streak * 0.1, 2)
    );

    // Mock rank calculation - you can implement actual ranking
    const currentRank = Math.floor(Math.random() * 50) + 1;
    const rankMovement = Math.random() > 0.5 ? `+${Math.floor(Math.random() * 5) + 1}` : `-${Math.floor(Math.random() * 3) + 1}`;
    
    let motivationLevel = 'Low';
    if (sparkPoints > 500) motivationLevel = 'High';
    else if (sparkPoints > 200) motivationLevel = 'Medium';

    return {
      currentRank,
      sparkPoints,
      rankMovement: `${rankMovement} since last week`,
      motivationLevel
    };
  }

  private calculateActivityPattern(chatHistory: any[]) {
    const dailyActivity = chatHistory.map(day => ({
      date: day.date,
      queries: day.subjectWise?.reduce((sum: number, subject: any) => sum + (subject.queries?.length || 0), 0) || 0,
      timeSpent: Math.floor((day.totalTokensSpent || 0) / 10), // minutes
      subjects: day.subjects || []
    }));

    // Calculate weekly pattern
    const weeklyPattern = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, 
      Friday: 0, Saturday: 0, Sunday: 0
    };

    dailyActivity.forEach(day => {
      const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (weeklyPattern.hasOwnProperty(dayOfWeek)) {
        weeklyPattern[dayOfWeek as keyof typeof weeklyPattern] += day.queries;
      }
    });

    // Calculate monthly trend (last 30 days)
    const monthlyTrend = dailyActivity.slice(-30).map(day => ({
      date: day.date,
      activity: day.queries + day.timeSpent
    }));

    return {
      dailyActivity,
      weeklyPattern,
      monthlyTrend
    };
  }

  private calculateStreak(chatHistory: any[]): number {
    if (chatHistory.length === 0) return 0;

    // Sort by date descending
    const sortedHistory = chatHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const day of sortedHistory) {
      const dayDate = new Date(day.date);
      const diffDays = Math.floor((currentDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = dayDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private findMostActiveTime(chatHistory: any[]): string {
    // Mock implementation - return a random time
    const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    return `${hours}:00`;
  }

  async generateStudentReport(userId: string, format: 'pdf' | 'excel' = 'pdf') {
    const analytics = await this.getStudentAnalytics(userId);
    
    // For now, return the analytics data
    // In a real implementation, you would generate PDF/Excel here
    return {
      message: `${format.toUpperCase()} report generation not implemented yet`,
      data: analytics,
      downloadUrl: `/admin/analytics/student/${userId}/download?format=${format}`
    };
  }

  async getStudentActivityChart(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const analytics = await this.getStudentAnalytics(userId);
    
    return {
      dailyActivity: analytics.analytics.activityPattern.dailyActivity,
      subjectDistribution: this.calculateSubjectDistribution(analytics.analytics.activityPattern.dailyActivity),
      performanceTrend: this.calculatePerformanceTrend(analytics.analytics.activityPattern.dailyActivity)
    };
  }

  private calculateSubjectDistribution(dailyActivity: any[]) {
    const subjectCounts: { [key: string]: number } = {};
    
    dailyActivity.forEach(day => {
      day.subjects.forEach((subject: string) => {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + day.queries;
      });
    });

    const total = Object.values(subjectCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(subjectCounts).map(([subject, queries]) => ({
      subject,
      percentage: total > 0 ? Math.round((queries / total) * 100) : 0,
      queries
    }));
  }

  private calculatePerformanceTrend(dailyActivity: any[]) {
    return dailyActivity.slice(-30).map((day, index) => ({
      date: day.date,
      accuracy: Math.random() * 20 + 80, // Mock accuracy 80-100%
      rank: Math.max(1, 50 - index) // Mock improving rank
    }));
  }
}
