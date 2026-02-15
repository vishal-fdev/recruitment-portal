// src/vendors/vendors.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /* ================= GET ALL ================= */
  @Get()
  @Roles(UserRole.VENDOR_MANAGER, UserRole.VENDOR_MANAGER_HEAD)
  getAllVendors() {
    return this.vendorsService.getAll();
  }

  /* ================= GET BY ID ================= */
  @Get(':id')
  @Roles(
    UserRole.VENDOR_MANAGER,
    UserRole.VENDOR_MANAGER_HEAD,
    UserRole.VENDOR,
  )
  getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  /* ================= CREATE ================= */
  @Post()
  @Roles(UserRole.VENDOR_MANAGER)
  createVendor(@Body() body: any) {
    return this.vendorsService.createVendor(body);
  }

  /* ================= TOGGLE STATUS ================= */
  @Patch(':id/toggle')
  @Roles(UserRole.VENDOR_MANAGER)
  toggleVendor(@Param('id') id: string) {
    return this.vendorsService.toggleStatus(id);
  }
}
