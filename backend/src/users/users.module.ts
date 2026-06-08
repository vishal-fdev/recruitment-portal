import { Module } from '@nestjs/common';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MongoModelsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
