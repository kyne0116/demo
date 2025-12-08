import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberProfile } from './entities/member-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemberProfile])],
  providers: [],
  controllers: [],
  exports: [],
})
export class MembersModule {}