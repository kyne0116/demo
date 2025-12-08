import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditLogService } from './audit-log.service';
import { User } from './entities/user.entity';
import { OperationLog } from './entities/operation-log.entity';
import { PermissionService } from '../auth/permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OperationLog]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    AuditLogService,
    PermissionService,
  ],
  exports: [
    UsersService,
    AuditLogService,
    PermissionService,
  ],
})
export class UsersModule {}