// src/candidates/candidates.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CandidateStatus } from './candidate-status.enum';

@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  /* ================= CREATE ================= */

  @Post()
  @Roles(UserRole.VENDOR)
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (_, file, cb) => {
          cb(null, Date.now() + extname(file.originalname));
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.service.createCandidate(
      body,
      `/uploads/resumes/${file.filename}`,
      req.user.vendorId,
    );
  }

  /* ================= LIST ================= */

  @Get()
  @Roles(
    UserRole.VENDOR,
    UserRole.VENDOR_MANAGER,
    UserRole.VENDOR_MANAGER_HEAD,
    UserRole.HIRING_MANAGER,
  )
  findAll(@Req() req: any) {
    return this.service.getCandidatesForUser(req.user);
  }

  /* ================= GET ONE ================= */

  @Get(':id')
  @Roles(
    UserRole.VENDOR,
    UserRole.VENDOR_MANAGER,
    UserRole.VENDOR_MANAGER_HEAD,
    UserRole.HIRING_MANAGER,
  )
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.service.getCandidateById(id, req.user);
  }

  /* ================= MANUAL STATUS UPDATE ================= */

  @Patch(':id/status')
  @Roles(UserRole.HIRING_MANAGER)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: CandidateStatus,
  ) {
    return this.service.updateStage(id, status);
  }

  /* ================= INTERVIEW FEEDBACK ================= */

  @Patch(':id/interview')
  @Roles(UserRole.HIRING_MANAGER)
  submitFeedback(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      roundId: number;
      feedback: string;
      decision: 'SELECT' | 'REJECT';
    },
  ) {
    return this.service.submitInterviewFeedback(
      id,
      body.roundId,
      body.feedback,
      body.decision,
    );
  }

  /* ================= RESUME ================= */

  @Get(':id/resume')
  @Roles(
    UserRole.VENDOR,
    UserRole.VENDOR_MANAGER,
    UserRole.VENDOR_MANAGER_HEAD,
    UserRole.HIRING_MANAGER,
  )
  async resume(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const path =
      await this.service.getResumePathForUser(
        id,
        req.user,
      );

    return res.sendFile(path, { root: '.' });
  }
}