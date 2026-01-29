import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';
import { CandidatesModule } from './candidates/candidates.module';
import { JobsModule } from './jobs/jobs.module';
import { DashboardModule } from './dashboard/dashboard.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'recruitment-demo.db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,        // 🔴 MUST BE HERE
    UsersModule,
    VendorsModule,
    CandidatesModule,
    JobsModule,
    DashboardModule,
    
  ],
})
export class AppModule {}
