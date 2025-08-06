import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get leaderboard rankings' })
  @ApiResponse({ status: 200, description: 'Leaderboard data retrieved successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all'], description: 'Time period for leaderboard' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by specific subject' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class/grade' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of users to return (default: 50)' })
  async getLeaderboard(
    @Req() req,
    @Query('period') period: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('subject') subject?: string,
    @Query('class') classFilter?: string,
    @Query('limit') limit: string = '50'
  ) {
    const currentUserId = req['userID'];
    return await this.leaderboardService.getLeaderboard(
      currentUserId,
      period,
      subject,
      classFilter,
      parseInt(limit)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-rank')
  @ApiOperation({ summary: 'Get current user rank and stats' })
  @ApiResponse({ status: 200, description: 'User rank data retrieved successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all'], description: 'Time period for ranking' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by specific subject' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class/grade' })
  async getUserRank(
    @Req() req,
    @Query('period') period: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('subject') subject?: string,
    @Query('class') classFilter?: string
  ) {
    const currentUserId = req['userID'];
    return await this.leaderboardService.getUserRank(
      currentUserId,
      period,
      subject,
      classFilter
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  @ApiOperation({ summary: 'Search users in leaderboard' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'query', required: true, description: 'Search query (name or student ID)' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all'], description: 'Time period for leaderboard' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by specific subject' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class/grade' })
  async searchUsers(
    @Req() req,
    @Query('query') searchQuery: string,
    @Query('period') period: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('subject') subject?: string,
    @Query('class') classFilter?: string
  ) {
    const currentUserId = req['userID'];
    return await this.leaderboardService.searchUsers(
      currentUserId,
      searchQuery,
      period,
      subject,
      classFilter
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('top-performers')
  @ApiOperation({ summary: 'Get top 3 performers for podium view' })
  @ApiResponse({ status: 200, description: 'Top performers retrieved successfully' })
  @ApiQuery({ name: 'period', required: false, enum: ['weekly', 'monthly', 'all'], description: 'Time period for ranking' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by specific subject' })
  @ApiQuery({ name: 'class', required: false, description: 'Filter by class/grade' })
  async getTopPerformers(
    @Req() req,
    @Query('period') period: 'weekly' | 'monthly' | 'all' = 'all',
    @Query('subject') subject?: string,
    @Query('class') classFilter?: string
  ) {
    const currentUserId = req['userID'];
    return await this.leaderboardService.getTopPerformers(
      currentUserId,
      period,
      subject,
      classFilter
    );
  }
}
