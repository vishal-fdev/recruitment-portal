import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Req,
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
  @Roles(UserRole.VENDOR_MANAGER, UserRole.VENDOR_MANAGER_HEAD)
  toggleVendor(@Param('id') id: string) {
    return this.vendorsService.toggleStatus(id);
  }

  /* ================= ESCALATIONS ================= */

  @Get(':id/escalations')
  getEscalations(@Param('id') id: string) {
    return this.vendorsService.getEscalations(id);
  }

  @Post(':id/escalations')
  createEscalation(
    @Param('id') vendorId: string,
    @Body() body: any,
    @Req() req,
  ) {
    return this.vendorsService.createEscalation(
      vendorId,
      body,
      req.user.role,
    );
  }

  @Patch('escalations/:id')
  updateEscalation(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.vendorsService.updateEscalation(id, body);
  }

  @Patch('escalations/:id/approve')
  approveEscalation(@Param('id') id: string) {
    return this.vendorsService.approveEscalation(id);
  }

  /* ================= ENGAGEMENT ================= */

  @Get(':id/engagements')
  getEngagements(@Param('id') id: string) {
    return this.vendorsService.getEngagements(id);
  }

  @Post(':id/engagements')
  createEngagement(@Param('id') id: string, @Body() body: any) {
    return this.vendorsService.createEngagement(id, body);
  }

  @Patch('engagements/:id')
  updateEngagement(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.vendorsService.updateEngagement(id, body);
  }

  /* ================= SOW ================= */

  @Get(':id/sows')
  getSOWs(@Param('id') id: string) {
    return this.vendorsService.getSOWs(id);
  }

  @Post(':id/sows')
  createSOW(@Param('id') id: string, @Body() body: any) {
    return this.vendorsService.createSOW(id, body);
  }

  @Patch('sows/:id')
  updateSOW(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.vendorsService.updateSOW(id, body);
  }

}