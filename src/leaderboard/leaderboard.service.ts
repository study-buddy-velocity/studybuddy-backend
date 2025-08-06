import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { UserDetails } from 'src/schemas/userDetails.schema';
import { ChatHistory } from 'src/schemas/chatHistory.schema';

export interface LeaderboardUser {
  userId: string;
  name: string;
  studentId: string;
  profileImage?: string;
  sparkPoints: number;
  rank: number;
  class: string;
  subjects: string[];
  totalQueries: number;
  streak: number;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  currentUser?: LeaderboardUser;
  totalUsers: number;
  period: string;
  filters: {
    subject?: string;
    class?: string;
  };
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserDetails.name) private userDetailsModel: Model<UserDetails>,
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistory>
  ) {}

  private getDateRange(period: 'weekly' | 'monthly' | 'all'): { startDate?: string; endDate?: string } {
    const now = new Date();
    const endDate = this.formatDate(now);
    
    switch (period) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return { startDate: this.formatDate(weekStart), endDate };
      
      case 'monthly':
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        return { startDate: this.formatDate(monthStart), endDate };
      
      case 'all':
      default:
        return {};
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateSparkPoints(totalTokens: number, totalQueries: number, streak: number): number {
    // Spark points calculation formula:
    // Base points from tokens (1 point per 100 tokens)
    // Bonus points for queries (5 points per query)
    // Streak multiplier (1.1x for every day of streak, capped at 2x)
    const basePoints = Math.floor(totalTokens / 100);
    const queryBonus = totalQueries * 5;
    const streakMultiplier = Math.min(1 + (streak * 0.1), 2);
    
    return Math.floor((basePoints + queryBonus) * streakMultiplier);
  }

  async getLeaderboard(
    currentUserId: string,
    period: 'weekly' | 'monthly' | 'all' = 'all',
    subject?: string,
    classFilter?: string,
    limit: number = 50
  ): Promise<LeaderboardResponse> {
    const { startDate, endDate } = this.getDateRange(period);
    
    // Build aggregation pipeline
    const matchStage: any = {};
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }
    if (subject) {
      matchStage.subjects = subject;
    }

    // Get user stats from chat history
    const userStats = await this.chatHistoryModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$totalTokensSpent' },
          totalQueries: { $sum: { $size: { $ifNull: ['$subjectWise', []] } } },
          uniqueSubjects: { $addToSet: '$subjects' },
          streak: { $sum: 1 } // Count of active days
        }
      },
      {
        $project: {
          userId: '$_id',
          totalTokens: 1,
          totalQueries: 1,
          subjects: { $reduce: { input: '$uniqueSubjects', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
          streak: 1,
          sparkPoints: {
            $floor: {
              $multiply: [
                { $add: [{ $divide: ['$totalTokens', 100] }, { $multiply: ['$totalQueries', 5] }] },
                { $min: [{ $add: [1, { $multiply: ['$streak', 0.1] }] }, 2] }
              ]
            }
          }
        }
      },
      { $sort: { sparkPoints: -1 } }
    ]);

    // Get user details for all users with stats
    const userIds = userStats.map(stat => stat.userId);
    const users = await this.userModel.find({ _id: { $in: userIds } })
      .populate('userDetails')
      .exec();

    // Combine stats with user details
    let leaderboardUsers: LeaderboardUser[] = [];
    
    for (const userStat of userStats) {
      const user = users.find(u => u._id.toString() === userStat.userId.toString());
      if (!user || !user.userDetails) continue;

      const userDetails = user.userDetails as any;
      
      // Apply class filter if specified
      if (classFilter && userDetails.class !== classFilter) continue;

      leaderboardUsers.push({
        userId: user._id.toString(),
        name: userDetails.name,
        studentId: userDetails.phoneno, // Using phone as student ID as per your design
        profileImage: userDetails.profileImage,
        sparkPoints: userStat.sparkPoints,
        rank: 0, // Will be set below
        class: userDetails.class,
        subjects: userStat.subjects,
        totalQueries: userStat.totalQueries,
        streak: userStat.streak
      });
    }

    // Sort by spark points and assign ranks
    leaderboardUsers.sort((a, b) => b.sparkPoints - a.sparkPoints);
    leaderboardUsers.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Limit results
    const limitedUsers = leaderboardUsers.slice(0, limit);

    // Find current user in the full list
    const currentUser = leaderboardUsers.find(user => user.userId === currentUserId);

    return {
      users: limitedUsers,
      currentUser,
      totalUsers: leaderboardUsers.length,
      period,
      filters: { subject, class: classFilter }
    };
  }

  async getUserRank(
    currentUserId: string,
    period: 'weekly' | 'monthly' | 'all' = 'all',
    subject?: string,
    classFilter?: string
  ): Promise<LeaderboardUser | null> {
    const leaderboard = await this.getLeaderboard(currentUserId, period, subject, classFilter, 1000);
    return leaderboard.currentUser || null;
  }

  async searchUsers(
    currentUserId: string,
    searchQuery: string,
    period: 'weekly' | 'monthly' | 'all' = 'all',
    subject?: string,
    classFilter?: string
  ): Promise<LeaderboardResponse> {
    const leaderboard = await this.getLeaderboard(currentUserId, period, subject, classFilter, 1000);
    
    const filteredUsers = leaderboard.users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.studentId.includes(searchQuery)
    );

    return {
      ...leaderboard,
      users: filteredUsers.slice(0, 50), // Limit search results
      totalUsers: filteredUsers.length
    };
  }

  async getTopPerformers(
    currentUserId: string,
    period: 'weekly' | 'monthly' | 'all' = 'all',
    subject?: string,
    classFilter?: string
  ): Promise<{ topThree: LeaderboardUser[]; currentUser?: LeaderboardUser }> {
    const leaderboard = await this.getLeaderboard(currentUserId, period, subject, classFilter, 3);
    
    return {
      topThree: leaderboard.users.slice(0, 3),
      currentUser: leaderboard.currentUser
    };
  }
}
