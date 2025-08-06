import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from 'src/guard/admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAnalyticsService } from './admin-analytics.service';

@ApiTags('Admin Analytics')
@Controller('admin/analytics')
@UseGuards(AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('student/:userId')
  @ApiOperation({ 
    summary: 'Get comprehensive student analytics (Admin only)',
    description: 'Get detailed analytics for a specific student including quiz stats, chat history, leaderboard position, and activity patterns'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Student analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        studentInfo: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            class: { type: 'string' },
            schoolName: { type: 'string' },
            profileImage: { type: 'string' },
            createdAt: { type: 'string' },
            subjects: { type: 'array', items: { type: 'string' } }
          }
        },
        analytics: {
          type: 'object',
          properties: {
            quizStats: {
              type: 'object',
              properties: {
                totalAttempted: { type: 'number' },
                accuracy: { type: 'number' },
                subjectWiseAttempts: { type: 'object' },
                averageScores: { type: 'object' },
                lastQuizDate: { type: 'string' },
                topicsCompleted: { type: 'number' }
              }
            },
            chatStats: {
              type: 'object',
              properties: {
                totalMessages: { type: 'number' },
                totalDoubts: { type: 'number' },
                mostDiscussedSubject: { type: 'string' },
                totalTimeSpent: { type: 'string' },
                timeOfDayMostActive: { type: 'string' },
                streak: { type: 'number' }
              }
            },
            leaderboardStats: {
              type: 'object',
              properties: {
                currentRank: { type: 'number' },
                sparkPoints: { type: 'number' },
                rankMovement: { type: 'string' },
                motivationLevel: { type: 'string' }
              }
            },
            activityPattern: {
              type: 'object',
              properties: {
                dailyActivity: { type: 'array' },
                weeklyPattern: { type: 'object' },
                monthlyTrend: { type: 'array' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getStudentAnalytics(@Param('userId') userId: string) {
    return this.adminAnalyticsService.getStudentAnalytics(userId);
  }

  @Get('student/:userId/download')
  @ApiOperation({ 
    summary: 'Download student analytics as PDF (Admin only)',
    description: 'Generate and download a comprehensive PDF report of student analytics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF report generated successfully',
    headers: {
      'Content-Type': { description: 'application/pdf' },
      'Content-Disposition': { description: 'attachment; filename="student-report.pdf"' }
    }
  })
  async downloadStudentReport(
    @Param('userId') userId: string,
    @Query('format') format: 'pdf' | 'excel' = 'pdf'
  ) {
    return this.adminAnalyticsService.generateStudentReport(userId, format);
  }

  @Get('student/:userId/activity-chart')
  @ApiOperation({ 
    summary: 'Get student activity chart data (Admin only)',
    description: 'Get chart data for student activity visualization'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Chart data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        dailyActivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              queries: { type: 'number' },
              timeSpent: { type: 'number' },
              subjects: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        subjectDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string' },
              percentage: { type: 'number' },
              queries: { type: 'number' }
            }
          }
        },
        performanceTrend: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              accuracy: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getStudentActivityChart(
    @Param('userId') userId: string,
    @Query('period') period: 'week' | 'month' | 'year' = 'month'
  ) {
    return this.adminAnalyticsService.getStudentActivityChart(userId, period);
  }
}
