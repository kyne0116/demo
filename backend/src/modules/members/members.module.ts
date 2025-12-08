import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberProfile } from './entities/member-profile.entity';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PointCalculationService } from './services/point-calculation.service';
import { MemberRegistrationService } from './services/member-registration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberProfile])
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    PointCalculationService,
    MemberRegistrationService
  ],
  exports: [
    MembersService,
    PointCalculationService,
    MemberRegistrationService
  ]
})
export class MembersModule {}