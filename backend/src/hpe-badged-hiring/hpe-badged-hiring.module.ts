import { Module } from '@nestjs/common';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';
import { HpeBadgedHiringController } from './hpe-badged-hiring.controller';
import { HpeBadgedHiringService } from './hpe-badged-hiring.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MongoModelsModule, UsersModule],
  controllers: [HpeBadgedHiringController],
  providers: [HpeBadgedHiringService],
})
export class HpeBadgedHiringModule {}

