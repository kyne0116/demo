import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditLogService } from './audit-log.service';
import { User } from './entities/user.entity';
import { OperationLog } from './entities/operation-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OperationLog]),
    forwardRef(() => AuthModule),  // 使用forwardRef解决循环依赖
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuditLogService,
  ],
  exports: [
    TypeOrmModule,  // 导出TypeOrmModule使其他模块可以访问User和OperationLog repository
    UsersService,
    AuditLogService,
  ],
})
export class UsersModule {}