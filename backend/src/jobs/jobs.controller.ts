import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getJobs(@Req() req: any) {
    return this.jobsService.getJobsForUser(req.user);
  }

  @Get(':id')
  @Roles(UserRole.VENDOR_MANAGER)
  getJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.getJobWithVendors(id);
  }

  // 🔥 Vendor Manager → Candidates per job
  @Get(':id/candidates')
  @Roles(UserRole.VENDOR_MANAGER)
  getCandidatesForJob(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.getCandidatesForJob(id);
  }

  @Post()
  @Roles(UserRole.VENDOR_MANAGER)
  createJob(@Body() body: any) {
    return this.jobsService.createJob(body);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR_MANAGER)
  updateJobStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.jobsService.setJobStatus(id, isActive);
  }

  @Patch(':id/vendors/:vendorId')
  @Roles(UserRole.VENDOR_MANAGER)
  updateVendorForJob(
    @Param('id', ParseIntPipe) jobId: number,
    @Param('vendorId') vendorId: string,
    @Body('isEnabled') isEnabled: boolean,
  ) {
    return this.jobsService.setVendorStatusForJob(
      jobId,
      vendorId,
      isEnabled,
    );
  }
}
