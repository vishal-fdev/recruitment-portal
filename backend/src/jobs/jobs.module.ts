import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MailService } from '../common/mail.service';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';

import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobApprovalsController } from './job-approvals.controller';

@Module({
  imports: [
    UsersModule,
    MongoModelsModule,
  ],
  controllers: [JobsController, JobApprovalsController],
  providers: [
    JobsService,
    MailService,
  ],
  exports: [JobsService],
})
export class JobsModule {}
