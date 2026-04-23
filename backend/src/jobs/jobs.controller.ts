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
  UploadedFiles,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

  @Get('template/:title')
  @Roles(UserRole.HIRING_MANAGER)
  getTemplate(@Param('title') title: string) {
    return this.jobsService.getTemplateByTitle(title);
  }

  @Get(':id')
  getJob(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.jobsService.getJobById(id, req.user);
  }

  /* ======================================================
     🔥 FIXED CREATE JOB (IMPORTANT)
  ====================================================== */

  @Post()
  @Roles(UserRole.HIRING_MANAGER)
  async createJob(@Body() body: any) {
    console.log('🔥 CONTROLLER HIT: CREATE JOB');

    const result = await this.jobsService.createJob(body);

    console.log('🔥 CONTROLLER DONE');

    return result;
  }

  @Patch(':id')
  @Roles(UserRole.HIRING_MANAGER)
  async updateJob(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    console.log('🔥 CONTROLLER HIT: UPDATE JOB');

    return this.jobsService.updateJob(id, body);
  }

  @Patch(':id/close')
  @Roles(UserRole.HIRING_MANAGER)
  closeJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.closeJob(id);
  }

  @Patch(':id/hold')
@Roles(UserRole.VENDOR_MANAGER)
holdJob(@Param('id', ParseIntPipe) id: number) {
  return this.jobsService.holdJob(id);
}

@Patch(':id/reopen')
@Roles(UserRole.VENDOR_MANAGER)
reopenJob(@Param('id', ParseIntPipe) id: number) {
  return this.jobsService.reopenJob(id);
}

  @Patch('positions/:id/close')
  @Roles(UserRole.HIRING_MANAGER)
  closePosition(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.closePosition(id);
  }

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

  @Patch(':id/vendors/:vendorId/status')
@Roles(UserRole.VENDOR_MANAGER)
updateVendorJobStatus(
  @Param('id', ParseIntPipe) id: number,
  @Param('vendorId') vendorId: string,
  @Body() body: { status: 'ACTIVE' | 'ON_HOLD' | 'CLOSED' },
) {
  return this.jobsService.updateVendorJobStatus(
    id,
    vendorId,
    body.status,
  );
}

  /* ===== FILE HANDLING (UNCHANGED) ===== */

  @Post(':id/jd')
  @Roles(UserRole.HIRING_MANAGER)
  @UseInterceptors(
    FilesInterceptor('jd', 10, {
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
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.jobsService.attachJD(id, files);
  }

  @Get(':id/jd/view')
  async viewJD(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.jobsService.getJD(id);
    return res.sendFile(file.path, { root: '.' });
  }

  @Get(':id/jd/download')
  async downloadJD(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.jobsService.getJD(id);
    return res.download(file.path, file.fileName);
  }

  @Get(':id/jd/download/:index')
  async downloadJDByIndex(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
  ) {
    const file = await this.jobsService.getJD(id, index);
    return res.download(file.path, file.fileName);
  }

  /* ================= PSQ HANDLING ================= */

@Post(':id/psq')
@Roles(UserRole.HIRING_MANAGER)
@UseInterceptors(
  FilesInterceptor('psq', 10, {
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
  @UploadedFiles() files: Express.Multer.File[],
) {
  return this.jobsService.attachPSQ(id, files);
}

@Get(':id/psq/view')
async viewPSQ(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const file = await this.jobsService.getPSQ(id);
  return res.sendFile(file.path, { root: '.' });
}

@Get(':id/psq/download')
async downloadPSQ(
  @Param('id', ParseIntPipe) id: number,
  @Res() res: Response,
) {
  const file = await this.jobsService.getPSQ(id);
  return res.download(file.path, file.fileName);
}

@Get(':id/psq/download/:index')
async downloadPSQByIndex(
  @Param('id', ParseIntPipe) id: number,
  @Param('index', ParseIntPipe) index: number,
  @Res() res: Response,
) {
  const file = await this.jobsService.getPSQ(id, index);
  return res.download(file.path, file.fileName);
}

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

