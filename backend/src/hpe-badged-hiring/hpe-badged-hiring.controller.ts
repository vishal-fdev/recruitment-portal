import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { HpeBadgedHiringService } from './hpe-badged-hiring.service';

const resumeStorage = (folder: string, prefix: string) =>
  diskStorage({
    destination: (_, __, cb) => {
      const uploadDir = join(process.cwd(), 'uploads', folder);
      mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (_, file, cb) => {
      cb(null, `${prefix}-${Date.now()}${extname(file.originalname)}`);
    },
  });

@Controller('hpe-badged-hiring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HpeBadgedHiringController {
  constructor(private readonly service: HpeBadgedHiringService) {}

  @Get('dashboard')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER, UserRole.BADGED_RECRUITER)
  dashboard(@Req() req: any) {
    return this.service.dashboard(req.user);
  }

  @Get()
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  findAll() {
    return this.service.findAll();
  }

  @Post('upload-excel')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  @UseInterceptors(
    FileInterceptor('excel', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return this.service.importExcel(file);
  }

  @Post(':id/resume')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: resumeStorage('hpe-badged-resumes', 'HPE-BADGED'),
    }),
  )
  uploadResume(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.attachResume(id, file);
  }

  @Get('recruiters')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  listRecruiters() {
    return this.service.listRecruiters();
  }

  @Post('recruiters')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  createRecruiter(@Body() body: any, @Req() req: any) {
    return this.service.createRecruiter(body, req.user);
  }

  @Get('jobs')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER, UserRole.BADGED_RECRUITER)
  listJobs(@Req() req: any) {
    return this.service.listJobs(req.user);
  }

  @Post('jobs')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'jd', maxCount: 1 },
        { name: 'psq', maxCount: 1 },
      ],
      {
        storage: resumeStorage('hpe-badged-job-files', 'BADGED-JOB'),
      },
    ),
  )
  createJob(
    @Body() body: any,
    @UploadedFiles() files: { jd?: Express.Multer.File[]; psq?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    return this.service.createJob(body, req.user, files);
  }

  @Patch('jobs/:id/recruiters')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER)
  assignRecruiters(@Param('id') id: string, @Body() body: any) {
    return this.service.assignRecruiters(id, body.recruiterIds || []);
  }

  @Get('candidate-submissions')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_HIRING_MANAGER, UserRole.BADGED_RECRUITER)
  listSubmissions(@Req() req: any) {
    return this.service.listSubmissions(req.user);
  }

  @Post('candidate-submissions/upload-excel')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_RECRUITER)
  @UseInterceptors(
    FileInterceptor('excel', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadSubmissionExcel(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.service.importSubmissionExcel(file, req.user);
  }

  @Post('candidate-submissions')
  @Roles(UserRole.VENDOR_MANAGER, UserRole.BADGED_RECRUITER)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: resumeStorage('hpe-badged-submissions', 'BADGED-SUBMISSION'),
    }),
  )
  createSubmission(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.service.createSubmission(body, file, req.user);
  }
}
