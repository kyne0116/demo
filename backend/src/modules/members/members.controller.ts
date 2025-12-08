import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, AddPointsDto } from './dto/member.dto';
import { MemberLevel } from './entities/member-profile.entity';

@ApiTags('会员管理')
@Controller('members')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: '注册新会员' })
  @ApiResponse({ status: 201, description: '注册成功' })
  async create(@Body() createMemberDto: CreateMemberDto) {
    const member = await this.membersService.createMember(createMemberDto);
    return {
      success: true,
      data: member.toResponseObject(),
      message: '会员注册成功'
    };
  }

  @Get()
  @ApiOperation({ summary: '获取会员列表' })
  @ApiQuery({ name: 'level', enum: MemberLevel, required: false, description: '会员等级过滤' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: 'number', required: false, description: '每页数量' })
  async findAll(
    @Query('level') level?: MemberLevel,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const result = await this.membersService.findAll(
      level,
      parseInt(page),
      parseInt(limit)
    );

    return {
      success: true,
      data: result.members.map(member => member.toResponseObject()),
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / parseInt(limit))
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取会员详情' })
  async findOne(@Param('id') id: string) {
    const member = await this.membersService.findOne(id);
    return {
      success: true,
      data: member.toResponseObject()
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新会员信息' })
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    const member = await this.membersService.updateMember(id, updateMemberDto);
    return {
      success: true,
      data: member.toResponseObject(),
      message: '会员信息更新成功'
    };
  }

  @Post(':id/points')
  @ApiOperation({ summary: '添加/扣减会员积分' })
  async addPoints(@Param('id') id: string, @Body() pointsData: AddPointsDto) {
    const member = await this.membersService.addPoints(id, pointsData);
    return {
      success: true,
      data: member.toResponseObject(),
      message: pointsData.points > 0 ? '积分添加成功' : '积分扣减成功'
    };
  }

  @Patch(':id/level')
  @ApiOperation({ summary: '更新会员等级' })
  async updateLevel(@Param('id') id: string) {
    const member = await this.membersService.updateMemberLevel(id);
    return {
      success: true,
      data: member.toResponseObject(),
      message: '会员等级更新成功'
    };
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '停用会员' })
  async deactivate(@Param('id') id: string) {
    const member = await this.membersService.deactivateMember(id);
    return {
      success: true,
      data: member.toResponseObject(),
      message: '会员已停用'
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '获取会员统计概览' })
  async getStatistics() {
    const stats = await this.membersService.getMemberStatistics();
    return {
      success: true,
      data: stats
    };
  }

  @Get('levels/thresholds')
  @ApiOperation({ summary: '获取会员等级阈值' })
  getLevelThresholds() {
    const thresholds = this.membersService.getLevelThresholds();
    return {
      success: true,
      data: thresholds
    };
  }

  @Get('discounts/rates')
  @ApiOperation({ summary: '获取会员折扣比例' })
  getDiscountRates() {
    const rates = this.membersService.getDiscountRates();
    return {
      success: true,
      data: rates
    };
  }

  @Post('batch/update-levels')
  @ApiOperation({ summary: '批量更新会员等级' })
  async batchUpdateLevels() {
    const updatedCount = await this.membersService.batchUpdateMemberLevels();
    return {
      success: true,
      data: { updatedCount },
      message: `成功更新 ${updatedCount} 个会员的等级`
    };
  }
}