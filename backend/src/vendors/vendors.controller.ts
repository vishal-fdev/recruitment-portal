import {
  Controller,
  Get,
  Post,
  Patch,
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
@Roles(UserRole.VENDOR_MANAGER)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  getVendors() {
    return this.vendorsService.findAll();
  }

  @Post()
  createVendor(@Body() body: any) {
    return this.vendorsService.createVendor(body);
  }

  @Patch(':id/toggle')
  toggleVendor(@Param('id') id: string) {
    return this.vendorsService.toggleStatus(id);
  }
}
