// src/jobs/jobs.controller.ts
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
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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
  getJob(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.getJobById(id);
  }

  @Post()
  @Roles(UserRole.HIRING_MANAGER)
  createJob(@Body() body: any) {
    return this.jobsService.createJob(body);
  }

  @Patch(':id/close')
  @Roles(UserRole.HIRING_MANAGER)
  closeJob(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.closeJob(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.VENDOR_MANAGER_HEAD)
  approve(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.approveJob(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.VENDOR_MANAGER_HEAD)
  reject(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.rejectJob(id);
  }

  @Post(':id/jd')
  @Roles(UserRole.HIRING_MANAGER)
  @UseInterceptors(
    FileInterceptor('jd', {
      storage: diskStorage({
        destination: './uploads/jds',
        filename: (_, file, cb) => {
          cb(null, `JOB-${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadJD(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.jobsService.attachJD(id, file);
  }

  @Get(':id/jd/view')
  async viewJD(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const job = await this.jobsService.getJD(id);
    return res.sendFile(job.jdPath, { root: '.' });
  }

  @Get(':id/jd/download')
  async downloadJD(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const job = await this.jobsService.getJD(id);
    return res.download(job.jdPath, job.jdFileName);
  }
}
