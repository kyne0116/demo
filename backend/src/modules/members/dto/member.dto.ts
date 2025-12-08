import { IsEmail, IsNotEmpty, IsString, IsOptional, IsPhoneNumber, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberLevel } from '../entities/member-profile.entity';

export class CreateMemberDto {
  @ApiProperty({ example: 'member@example.com', description: '会员邮箱' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: '会员密码' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^.{6,}$/, { message: '密码至少6个字符' })
  password: string;

  @ApiProperty({ example: '13800138000', description: '会员手机号' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号码' })
  phone: string;

  @ApiProperty({ example: '张三', description: '会员姓名' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^.{2,}$/, { message: '姓名至少2个字符' })
  name: string;

  @ApiProperty({ example: 'M1234567890123', description: '会员号（可选，如不提供则自动生成）', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^M\d{13}$/, { message: '会员号格式不正确，应为M开头的13位数字' })
  memberNumber?: string;

  @ApiProperty({ example: 'REF123', description: '推荐码（可选）', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{3,10}$/, { message: '推荐码格式不正确，应为3-10位大写字母或数字' })
  referralCode?: string;
}

export class UpdateMemberDto {
  @ApiProperty({ example: '张三', description: '会员姓名', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^.{2,}$/, { message: '姓名至少2个字符' })
  name?: string;

  @ApiProperty({ example: '13800138000', description: '会员手机号', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号码' })
  phone?: string;

  @ApiProperty({ example: MemberLevel.SILVER, description: '会员等级', required: false })
  @IsOptional()
  @IsString()
  level?: MemberLevel;

  @ApiProperty({ example: 1500, description: '积分', required: false })
  @IsOptional()
  points?: number;

  @ApiProperty({ example: 500.00, description: '累计消费金额', required: false })
  @IsOptional()
  totalSpent?: number;

  @ApiProperty({ example: true, description: '是否激活', required: false })
  @IsOptional()
  isActive?: boolean;
}

export class AddPointsDto {
  @ApiProperty({ example: 500, description: '积分数量（正数为增加，负数为扣减）' })
  @IsNotEmpty()
  points: number;

  @ApiProperty({ example: 'purchase', description: '积分类型' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: '购买订单获得积分', description: '积分说明', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class MemberInfoResponseDto {
  @ApiProperty({ example: 'uuid', description: '会员ID' })
  id: string;

  @ApiProperty({ example: 'member@example.com', description: '会员邮箱' })
  email: string;

  @ApiProperty({ example: '张三', description: '会员姓名' })
  name: string;

  @ApiProperty({ example: '13800138000', description: '会员手机号' })
  phone: string;

  @ApiProperty({ example: 'M1234567890123', description: '会员号' })
  memberNumber: string;

  @ApiProperty({ example: MemberLevel.SILVER, description: '会员等级' })
  level: MemberLevel;

  @ApiProperty({ example: 1500, description: '积分' })
  points: number;

  @ApiProperty({ example: 500.00, description: '累计消费金额' })
  totalSpent: number;

  @ApiProperty({ example: true, description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: '最后活跃时间' })
  lastActiveAt: Date | null;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ example: '2023-12-01T10:00:00Z', description: '更新时间' })
  updatedAt: Date;
}

export class MemberListResponseDto {
  @ApiProperty({ type: [MemberInfoResponseDto] })
  members: MemberInfoResponseDto[];

  @ApiProperty({ example: 25, description: '总数量' })
  total: number;

  @ApiProperty({ example: 3, description: '当前页码' })
  page: number;

  @ApiProperty({ example: 10, description: '每页数量' })
  limit: number;
}