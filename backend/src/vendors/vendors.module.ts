// src/vendors/vendors.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { Vendor } from './vendors.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    // 🔥 BOTH entities MUST be here
    TypeOrmModule.forFeature([Vendor, User]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
