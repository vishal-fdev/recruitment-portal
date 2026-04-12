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

  /* ======================================================
     GET JOBS
  ====================================================== */

  @Get()
  getJobs(@Req() req: any) {
    return this.jobsService.getJobsForUser(req.user);
  }

  // ADD THIS ABOVE @Get(':id')

@Get('template/:title')
@Roles(UserRole.HIRING_MANAGER)
getTemplate(@Param('title') title: string) {
  return this.jobsService.getTemplateByTitle(title);
}

  @Get(':id')
  getJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.getJobById(id);
  }

  /* ======================================================
     CREATE JOB
  ====================================================== */

  @Post()
  @Roles(UserRole.HIRING_MANAGER)
  createJob(@Body() body: any) {
    return this.jobsService.createJob(body);
  }

/* ======================================================
   UPDATE JOB (EDIT & RESUBMIT)
====================================================== */

@Patch(':id')
@Roles(UserRole.HIRING_MANAGER)
updateJob(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.jobsService.updateJob(id, body);
}

  /* ======================================================
     CLOSE PARENT JOB
  ====================================================== */

  @Patch(':id/close')
  @Roles(UserRole.HIRING_MANAGER)
  closeJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.closeJob(id);
  }

  /* ======================================================
     🔥 CLOSE CHILD POSITION (NEW)
  ====================================================== */

  @Patch('positions/:id/close')
  @Roles(UserRole.HIRING_MANAGER)
  closePosition(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.closePosition(id);
  }

  /* ======================================================
     APPROVAL FLOW
  ====================================================== */

  @Patch(':id/approve')
  @Roles(UserRole.VENDOR_MANAGER_HEAD)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.approveJob(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.VENDOR_MANAGER_HEAD)
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.rejectJob(id);
  }

  /* ======================================================
     VENDOR ASSIGNMENT
  ====================================================== */

  @Patch(':id/vendors/:vendorId')
  @Roles(UserRole.VENDOR_MANAGER)
  toggleVendor(
    @Param('id', ParseIntPipe) id: number,
    @Param('vendorId') vendorId: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.jobsService.toggleVendor(
      id,
      vendorId,
      body.isEnabled,
    );
  }

  /* ======================================================
     JD HANDLING
  ====================================================== */

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

  /* ======================================================
   PSQ HANDLING (ADD BELOW JD)
====================================================== */

@Post(':id/psq')
@Roles(UserRole.HIRING_MANAGER)
@UseInterceptors(
  FileInterceptor('psq', {
    storage: diskStorage({
      destination: './uploads/psq',
      filename: (_, file, cb) => {
        cb(null, `PSQ-${Date.now()}${extname(file.originalname)}`);
      },
    }),
  }),
)
uploadPSQ(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.jobsService.attachPSQ(id, file);
}

@Get(':id/psq/view')
async viewPSQ(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const job = await this.jobsService.getPSQ(id);
  return res.sendFile(job.psqPath, { root: '.' });
}

@Get(':id/psq/download')
async downloadPSQ(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const job = await this.jobsService.getPSQ(id);
  return res.download(job.psqPath, job.psqFileName);
}

/* ======================================================
   POSITION FILE UPLOAD (NEW)
====================================================== */

@Post('positions/:id/jd')
@Roles(UserRole.HIRING_MANAGER)
@UseInterceptors(
  FileInterceptor('jd', {
    storage: diskStorage({
      destination: './uploads/jds',
      filename: (_, file, cb) => {
        cb(null, `POS-JD-${Date.now()}${extname(file.originalname)}`);
      },
    }),
  }),
)
uploadPositionJD(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.jobsService.attachPositionJD(id, file);
}

@Post('positions/:id/psq')
@Roles(UserRole.HIRING_MANAGER)
@UseInterceptors(
  FileInterceptor('psq', {
    storage: diskStorage({
      destination: './uploads/psq',
      filename: (_, file, cb) => {
        cb(null, `POS-PSQ-${Date.now()}${extname(file.originalname)}`);
      },
    }),
  }),
)
uploadPositionPSQ(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.jobsService.attachPositionPSQ(id, file);
}

@Get('positions/:id/jd/download')
async downloadPositionJD(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const pos = await this.jobsService.getPositionJD(id);
  return res.download(pos.jdPath, pos.jdFileName);
}

@Get('positions/:id/psq/download')
async downloadPositionPSQ(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const pos = await this.jobsService.getPositionPSQ(id);
  return res.download(pos.psqPath, pos.psqFileName);
}
}