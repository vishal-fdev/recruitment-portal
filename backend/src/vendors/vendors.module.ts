// src/vendors/vendors.module.ts
import { Module } from '@nestjs/common';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';
import { UsersModule } from '../users/users.module';

import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

@Module({
  imports: [
    MongoModelsModule,
    UsersModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
