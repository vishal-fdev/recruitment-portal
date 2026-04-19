import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JobsService } from './jobs.service';

@Controller('job-approvals')
export class JobApprovalsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('approve/:id')
  async approve(@Param('id') id: number, @Res() res: Response) {
    await this.jobsService.approveJob(Number(id));

    return res.redirect(
      `${process.env.FRONTEND_URL}/vendor-manager-head/jobs/${id}?emailAction=approved`,
    );
  }

  @Get('reject/:id')
  async reject(@Param('id') id: number, @Res() res: Response) {
    await this.jobsService.rejectJob(Number(id));

    return res.redirect(
      `${process.env.FRONTEND_URL}/vendor-manager-head/jobs/${id}?emailAction=rejected`,
    );
  }
}
