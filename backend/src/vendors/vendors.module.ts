// src/vendors/vendors.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

import { Vendor } from './vendors.entity';
import { VendorProfile } from './vendor-profile.entity';
import { VendorEscalation } from './vendor-escalation.entity';
import { VendorEngagement } from './vendor-engagement.entity';
import { VendorSOW } from './vendor-sow.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      VendorProfile,
      VendorEscalation,
      VendorEngagement,
      VendorSOW,
      User,
    ]),
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [TypeOrmModule],
})
export class VendorsModule {}
