// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongoModelsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
